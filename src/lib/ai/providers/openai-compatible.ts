import type { AiProvider, GenerateContentResult } from "../provider";

type OpenAiCompatibleInput = {
  model?: string;
  prompt: string;
  provider: Exclude<AiProvider, "mock">;
};

export type AiProviderErrorCode =
  | "missing_configuration"
  | "timeout"
  | "rate_limited"
  | "authentication_failed"
  | "provider_unavailable"
  | "network_error"
  | "invalid_response"
  | "empty_response"
  | "truncated_response"
  | "content_filtered";

export class AiProviderRequestError extends Error {
  constructor(
    public readonly code: AiProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AiProviderRequestError";
  }
}

export async function generateWithOpenAiCompatibleProvider({
  model = process.env.AI_MODEL || "qwen-plus",
  prompt,
  provider,
}: OpenAiCompatibleInput): Promise<GenerateContentResult> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;

  if (!apiKey) {
    throw new AiProviderRequestError("missing_configuration", "AI provider credentials are not configured.");
  }

  if (!baseUrl) {
    throw new AiProviderRequestError("missing_configuration", "AI provider endpoint is not configured.");
  }

  const timeoutMs = readTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      body: JSON.stringify({
        messages: [{ content: prompt, role: "user" }],
        model,
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      throw new AiProviderRequestError("timeout", "AI provider request timed out.");
    }
    throw new AiProviderRequestError("network_error", "AI provider network request failed.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw classifyHttpError(response.status);
  }

  let data: {
    choices?: Array<{ finish_reason?: string | null; message?: { content?: string | null } }>;
    usage?: Record<string, number>;
  };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw new AiProviderRequestError("invalid_response", "AI provider returned invalid JSON.");
  }

  const choice = data.choices?.[0];
  const content = choice?.message?.content?.trim();
  const finishReason = choice?.finish_reason || "";

  if (!content) {
    throw new AiProviderRequestError("empty_response", "AI provider returned an empty response.");
  }
  if (finishReason === "length" || finishReason === "max_tokens") {
    throw new AiProviderRequestError("truncated_response", "AI provider response was truncated.");
  }
  if (finishReason === "content_filter") {
    throw new AiProviderRequestError("content_filtered", "AI provider response was filtered.");
  }

  return {
    content,
    elapsedMs: Date.now() - startedAt,
    finishReason,
    model,
    prompt,
    provider,
    tokenUsage: data.usage,
  };
}

function readTimeoutMs(): number {
  const configured = Number(process.env.AI_TIMEOUT_MS || "60000");
  return Number.isFinite(configured) && configured > 0 ? configured : 60_000;
}

function classifyHttpError(status: number): AiProviderRequestError {
  if (status === 401 || status === 403) {
    return new AiProviderRequestError("authentication_failed", "AI provider authentication failed.");
  }
  if (status === 429) {
    return new AiProviderRequestError("rate_limited", "AI provider rate limit reached.");
  }
  if (status >= 500) {
    return new AiProviderRequestError("provider_unavailable", "AI provider is temporarily unavailable.");
  }
  return new AiProviderRequestError("invalid_response", "AI provider rejected the request.");
}
