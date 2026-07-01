import type { GenerationRecord, GenerationStatus } from "../data/types";
import { validateAndCleanSceneOutput } from "./output-safety";

export type GenerationRecordPresentation = {
  cleanedContent: string;
  displayable: boolean;
  message: string;
  status: GenerationStatus;
};

export function getGenerationRecordPresentation(record: GenerationRecord): GenerationRecordPresentation {
  const status = normalizeGenerationStatus(record.status);
  if (status === "failed") {
    return {
      cleanedContent: "",
      displayable: false,
      message: "这次生成未成功，请重新生成。",
      status,
    };
  }

  const candidate = status === "success" ? record.cleanedContent : record.cleanedContent || record.result;
  if (!candidate.trim()) {
    return {
      cleanedContent: "",
      displayable: false,
      message: status === "legacy" ? "这条旧记录没有可安全展示的内容。" : "生成内容格式异常，请重新生成。",
      status,
    };
  }

  const safe = validateAndCleanSceneOutput({ rawResponse: candidate, scene: record.generationType });
  if (!safe.ok) {
    return {
      cleanedContent: "",
      displayable: false,
      message: status === "legacy" ? "这条旧记录格式异常，原始内容已隐藏。" : "生成内容格式异常，请重新生成。",
      status,
    };
  }

  return {
    cleanedContent: safe.cleanedContent,
    displayable: true,
    message: "",
    status,
  };
}

export function normalizeGenerationStatus(status: string | null | undefined): GenerationStatus {
  return status === "success" || status === "failed" ? status : "legacy";
}

export function isBillableGeneration(record: Pick<GenerationRecord, "status">): boolean {
  return normalizeGenerationStatus(record.status) !== "failed";
}
