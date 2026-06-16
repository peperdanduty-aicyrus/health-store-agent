"use server";

import type { WorkbenchGenerationState } from "@/app/lvminglei/actions";
import type { WorkbenchGenerationType } from "@/lib/data/types";
import { workbenchToolDefinitions } from "@/lib/domain/workbench";
import { generateWorkbenchPreview } from "@/lib/workbench/generation";
import { isWorkbenchPublicTestEnabled } from "@/lib/workbench/public-test";

export async function generateWorkbenchTest(
  _previousState: WorkbenchGenerationState,
  formData: FormData,
): Promise<WorkbenchGenerationState> {
  if (!isWorkbenchPublicTestEnabled()) {
    return { message: "测试页已关闭。", success: false };
  }

  const type = String(formData.get("type") || "") as WorkbenchGenerationType;

  if (!workbenchToolDefinitions[type]) {
    return { message: "未知的生成工具。", success: false };
  }

  const input = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => key !== "type")
      .map(([key, value]) => [key, String(value || "").trim()]),
  ) as Record<string, string>;

  const preview = await generateWorkbenchPreview(type, input);

  return {
    inputSummary: preview.inputSummary,
    message: `${preview.message}测试页不会保存历史记录。`,
    result: preview.result,
    success: preview.success,
  };
}
