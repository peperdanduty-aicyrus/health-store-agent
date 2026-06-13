import type { AiProvider, GenerateContentResult } from "../provider";

type OpenAiCompatibleInput = {
  model?: string;
  prompt: string;
  provider: Exclude<AiProvider, "mock">;
};

export async function generateWithOpenAiCompatibleProvider({
  model = process.env.AI_MODEL || "qwen-plus",
  prompt,
  provider,
}: OpenAiCompatibleInput): Promise<GenerateContentResult> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;

  if (!apiKey) {
    throw new Error("AI_API_KEY is required before calling a real model provider.");
  }

  if (!baseUrl) {
    throw new Error("AI_BASE_URL is required before calling a real model provider.");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
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
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return {
    content,
    model,
    prompt,
    provider,
  };
}
