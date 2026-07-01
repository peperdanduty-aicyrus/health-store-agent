import { describe, expect, it } from "vitest";
import type { GenerationRecord } from "../data/types";
import { getGenerationRecordPresentation } from "./generation-record";

const cleanContent = JSON.stringify({
  shortPosts: ["清洗后的朋友圈文案"],
  longPosts: ["清洗后的长文案"],
  imageIdeas: ["门店环境"],
  closingGuide: "可以先看看问题在哪。",
});

function record(overrides: Partial<GenerationRecord>): GenerationRecord {
  return {
    id: "generation_test",
    userId: "user_test",
    phone: "test-user",
    storeName: "测试门店",
    storeType: "本地门店",
    planName: "standard_monthly",
    generationType: "moments",
    projectName: "线上页面体检",
    targetCustomer: "本地门店老板",
    purpose: "提升信任",
    extraInfo: "",
    prompt: "prompt",
    result: "旧 result",
    sensitiveCheckResult: "未发现明显高风险表达。",
    copied: false,
    usedStoreProfile: false,
    userNote: "",
    modelProvider: "mock",
    modelName: "mock-model",
    createdAt: "2026-06-29T12:00:00.000Z",
    status: "legacy",
    rawResponse: "",
    cleanedContent: "",
    errorCode: "",
    errorMessage: "",
    requestId: "",
    finishReason: "",
    tokenUsage: "",
    elapsedMs: null,
    promptVersion: "",
    ...overrides,
  };
}

describe("generation record presentation", () => {
  it("prefers cleaned content and never displays raw response", () => {
    const presentation = getGenerationRecordPresentation(
      record({
        cleanedContent: cleanContent,
        rawResponse: "<script>raw response</script>",
        result: "raw result fallback",
        status: "success",
      }),
    );

    expect(presentation).toMatchObject({ displayable: true, status: "success" });
    expect(presentation.cleanedContent).toContain("清洗后的朋友圈文案");
    expect(presentation.cleanedContent).not.toContain("raw response");
    expect(presentation.cleanedContent).not.toContain("raw result fallback");
  });

  it("distinguishes failed records without exposing raw content", () => {
    const presentation = getGenerationRecordPresentation(
      record({ rawResponse: "Error: provider stack", status: "failed", errorMessage: "模型服务暂时不可用。" }),
    );

    expect(presentation).toMatchObject({ displayable: false, status: "failed" });
    expect(JSON.stringify(presentation)).not.toContain("provider stack");
  });

  it("keeps safe legacy records readable and hides unsafe legacy result", () => {
    const safeLegacy = getGenerationRecordPresentation(record({ result: cleanContent, status: "legacy" }));
    const unsafeLegacy = getGenerationRecordPresentation(
      record({ result: "```json\n{\"error\":\"legacy\"}\n```", status: "legacy" }),
    );

    expect(safeLegacy).toMatchObject({ displayable: true, status: "legacy" });
    expect(unsafeLegacy).toMatchObject({ displayable: false, status: "legacy" });
    expect(JSON.stringify(unsafeLegacy)).not.toContain("legacy\\\"}");
  });
});
