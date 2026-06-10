import { generateWithOpenAiCompatibleProvider } from "./openai-compatible";

type DeepSeekInput = {
  prompt: string;
};

export function generateWithDeepSeek({ prompt }: DeepSeekInput) {
  return generateWithOpenAiCompatibleProvider({
    model: process.env.AI_MODEL || "deepseek-chat",
    prompt,
    provider: "deepseek",
  });
}
