import { generateWithOpenAiCompatibleProvider } from "./openai-compatible";

type QwenInput = {
  prompt: string;
  provider?: "qwen" | "openai-compatible";
};

export function generateWithQwen({ prompt, provider = "qwen" }: QwenInput) {
  return generateWithOpenAiCompatibleProvider({
    model: process.env.AI_MODEL || "qwen-plus",
    prompt,
    provider,
  });
}

