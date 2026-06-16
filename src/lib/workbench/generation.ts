import { generateWorkbenchContent, type AiProvider } from "../ai/provider";
import type { WorkbenchGenerationType } from "../data/types";
import { workbenchToolDefinitions } from "../domain/workbench";
import { sanitizeWorkbenchOutputForPrice } from "../prompts/workbench";
import { replaceSensitiveWords } from "../safety/sensitive-words";

export type WorkbenchPreviewResult = {
  inputSummary: Record<string, string>;
  message: string;
  model: string;
  prompt: string;
  provider: AiProvider;
  result: string;
  success: boolean;
};

export async function generateWorkbenchPreview(
  type: WorkbenchGenerationType,
  input: Record<string, string>,
  provider?: AiProvider,
): Promise<WorkbenchPreviewResult> {
  if (!workbenchToolDefinitions[type]) {
    return {
      inputSummary: {},
      message: "未知的生成工具。",
      model: "",
      prompt: "",
      provider: provider || "mock",
      result: "",
      success: false,
    };
  }

  const generated = await generateWorkbenchContent({ input, provider, type });
  const priceSafeContent = sanitizeWorkbenchOutputForPrice(generated.content, input);
  const safeResult = replaceSensitiveWords(priceSafeContent);

  return {
    inputSummary: pickWorkbenchInputSummary(input, type),
    message:
      safeResult.replacements.length > 0
        ? `已生成，并自动替换风险表达：${safeResult.replacements.map((item) => `${item.from}→${item.to}`).join("、")}。`
        : "已生成。",
    model: generated.model,
    prompt: generated.prompt,
    provider: generated.provider,
    result: safeResult.content,
    success: true,
  };
}

export function pickWorkbenchInputSummary(input: Record<string, string>, type: WorkbenchGenerationType): Record<string, string> {
  return {
    customerPain: input.customerPain || "",
    extraInfo: input.extraInfo || "",
    generationType: type,
    priceExposure: input.priceExposure || "",
    product: input.product || "",
    publishPlatform: input.publishPlatform || "",
    targetCustomer: input.targetCustomer || "",
    targetPlatform: input.targetPlatform || "",
    usageScene: input.usageScene || "",
  };
}
