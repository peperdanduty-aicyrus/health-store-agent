import type { CreateGenerationInput, GenerationRecord } from "./types";

type GenerationDiagnostics = Pick<
  GenerationRecord,
  | "status"
  | "rawResponse"
  | "cleanedContent"
  | "errorCode"
  | "errorMessage"
  | "requestId"
  | "finishReason"
  | "tokenUsage"
  | "elapsedMs"
  | "promptVersion"
>;

export function normalizeGenerationDiagnostics(input: CreateGenerationInput): GenerationDiagnostics {
  return {
    status: input.status === "success" || input.status === "failed" ? input.status : "legacy",
    rawResponse: input.rawResponse ?? "",
    cleanedContent: input.cleanedContent ?? "",
    errorCode: input.errorCode ?? "",
    errorMessage: input.errorMessage ?? "",
    requestId: input.requestId ?? "",
    finishReason: input.finishReason ?? "",
    tokenUsage: input.tokenUsage ?? "",
    elapsedMs: input.elapsedMs ?? null,
    promptVersion: input.promptVersion ?? "",
  };
}
