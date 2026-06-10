import type { SceneKey } from "../domain/scenes";
import { buildScenePrompt, type GenerationInput, type StoreProfileForPrompt } from "../prompts/scenes";
import { generateWithDeepSeek } from "./providers/deepseek";
import { generateWithMockProvider } from "./providers/mock";
import { generateWithQwen } from "./providers/qwen";

export type AiProvider = "mock" | "qwen" | "deepseek" | "openai-compatible";

export type GenerateContentInput = {
  input: GenerationInput;
  provider?: AiProvider;
  scene: SceneKey;
  storeProfile: StoreProfileForPrompt;
  userId: string;
};

export type GenerateContentResult = {
  content: string;
  model: string;
  prompt: string;
  provider: AiProvider;
};

export async function generateContent({
  input,
  provider = readProviderFromEnv(),
  scene,
  storeProfile,
  userId,
}: GenerateContentInput): Promise<GenerateContentResult> {
  const prompt = buildScenePrompt(scene, storeProfile, input);

  if (provider === "mock") {
    return generateWithMockProvider({ input, prompt, scene, storeProfile, userId });
  }

  if (provider === "qwen") {
    return generateWithQwen({ prompt });
  }

  if (provider === "deepseek") {
    return generateWithDeepSeek({ prompt });
  }

  return generateWithQwen({ prompt, provider: "openai-compatible" });
}

function readProviderFromEnv(): AiProvider {
  const provider = process.env.AI_PROVIDER;
  if (provider === "qwen" || provider === "deepseek" || provider === "openai-compatible") {
    return provider;
  }
  return "mock";
}

