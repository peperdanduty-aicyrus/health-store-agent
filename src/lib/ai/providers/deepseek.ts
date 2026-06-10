import { generateWithOpenAiCompatibleProvider } from "./openai-compatible";

type DeepSeekInput = {
  prompt: string;
};

export function generateWithDeepSeek({ prompt }: DeepSeekInput) {
  return generateWithOpenAiCompatibleProvider({
    model: "deepseek-v4-flash",
    prompt,
    provider: "deepseek",
  });
}
