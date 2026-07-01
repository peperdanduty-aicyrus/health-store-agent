import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AiProviderRequestError,
  generateWithOpenAiCompatibleProvider,
} from "./openai-compatible";

const originalEnv = { ...process.env };

describe("OpenAI-compatible provider safety", () => {
  beforeEach(() => {
    process.env.AI_API_KEY = "unit-test-placeholder";
    process.env.AI_BASE_URL = "https://provider.invalid/v1";
    process.env.AI_TIMEOUT_MS = "20";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it("rejects a blank model response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: "   " } }] }), {
          status: 200,
        }),
      ),
    );

    await expect(
      generateWithOpenAiCompatibleProvider({ prompt: "test", provider: "qwen" }),
    ).rejects.toMatchObject({ code: "empty_response" });
  });

  it("rejects a response truncated by token length", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ finish_reason: "length", message: { content: '{"titles":[' } }] }), {
          status: 200,
        }),
      ),
    );

    await expect(
      generateWithOpenAiCompatibleProvider({ prompt: "test", provider: "qwen" }),
    ).rejects.toMatchObject({ code: "truncated_response" });
  });

  it("categorizes rate limiting without including the provider body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("upstream secret detail", { status: 429 })));

    const error = await generateWithOpenAiCompatibleProvider({ prompt: "test", provider: "qwen" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(AiProviderRequestError);
    expect(error).toMatchObject({ code: "rate_limited" });
    expect(String(error)).not.toContain("upstream secret detail");
  });

  it("times out a stalled request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
      ),
    );

    await expect(
      generateWithOpenAiCompatibleProvider({ prompt: "test", provider: "qwen" }),
    ).rejects.toMatchObject({ code: "timeout" });
  });
});
