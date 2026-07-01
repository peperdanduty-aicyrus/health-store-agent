import { buildScenePrompt } from "../prompts/scenes";
import { generateContent, type GenerateContentInput, type GenerateContentResult } from "./provider";
import { validateAndCleanSceneOutput } from "./output-safety";

export const AGENT_PROMPT_VERSION = "agent-scene-output-v1";

type GenerationDependencies = {
  generate?: (input: GenerateContentInput) => Promise<GenerateContentResult>;
};

type GenerationMetadata = {
  elapsedMs: number | null;
  finishReason: string;
  model: string;
  prompt: string;
  promptVersion: string;
  provider: string;
  rawResponse: string;
  requestId: string;
  tokenUsage: string;
};

export type SafeGenerationServiceResult =
  | (GenerationMetadata & {
      cleanedContent: string;
      status: "success";
    })
  | (GenerationMetadata & {
      errorCode: string;
      errorMessage: string;
      publicMessage: string;
      status: "failed";
    });

export async function generateSafeSceneContent(
  input: GenerateContentInput,
  dependencies: GenerationDependencies = {},
): Promise<SafeGenerationServiceResult> {
  const requestId = crypto.randomUUID();
  const prompt = buildScenePrompt(input.scene, input.storeProfile, input.input);
  const generate = dependencies.generate ?? generateContent;

  try {
    const generated = await generate(input);
    const rawResponse = generated.content;
    const safety = validateAndCleanSceneOutput({
      finishReason: generated.finishReason,
      rawResponse,
      scene: input.scene,
    });
    const metadata = buildMetadata({ generated, prompt, rawResponse, requestId });

    if (!safety.ok) {
      return {
        ...metadata,
        errorCode: safety.errorCode,
        errorMessage: safety.errorMessage,
        publicMessage: "生成内容格式异常，请重新生成。",
        status: "failed",
      };
    }

    return {
      ...metadata,
      cleanedContent: safety.cleanedContent,
      status: "success",
    };
  } catch (error) {
    const errorCode = readSafeErrorCode(error);
    return {
      elapsedMs: null,
      errorCode,
      errorMessage: safeInternalErrorMessage(errorCode),
      finishReason: "",
      model: "",
      prompt,
      promptVersion: AGENT_PROMPT_VERSION,
      provider: "",
      publicMessage: publicErrorMessage(errorCode),
      rawResponse: "",
      requestId,
      status: "failed",
      tokenUsage: "",
    };
  }
}

function buildMetadata({
  generated,
  prompt,
  rawResponse,
  requestId,
}: {
  generated: GenerateContentResult;
  prompt: string;
  rawResponse: string;
  requestId: string;
}): GenerationMetadata {
  return {
    elapsedMs: generated.elapsedMs ?? null,
    finishReason: generated.finishReason ?? "",
    model: generated.model,
    prompt: generated.prompt || prompt,
    promptVersion: AGENT_PROMPT_VERSION,
    provider: generated.provider,
    rawResponse,
    requestId,
    tokenUsage: generated.tokenUsage ? JSON.stringify(generated.tokenUsage) : "",
  };
}

function readSafeErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "provider_error";
}

function publicErrorMessage(errorCode: string): string {
  if (errorCode === "timeout") {
    return "生成超时，请稍后重试。";
  }
  if (errorCode === "rate_limited" || errorCode === "provider_unavailable") {
    return "AI 服务暂时繁忙，请稍后重试。";
  }
  return "生成失败，请稍后重试。";
}

function safeInternalErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    authentication_failed: "模型服务认证失败。",
    content_filtered: "模型输出被服务商过滤。",
    empty_response: "模型返回空内容。",
    invalid_response: "模型服务返回格式异常。",
    missing_configuration: "模型服务配置不完整。",
    network_error: "模型服务网络请求失败。",
    provider_error: "模型服务调用失败。",
    provider_unavailable: "模型服务暂时不可用。",
    rate_limited: "模型服务请求频率受限。",
    timeout: "模型服务请求超时。",
    truncated_response: "模型输出被截断。",
  };
  return messages[errorCode] ?? "模型服务调用失败。";
}
