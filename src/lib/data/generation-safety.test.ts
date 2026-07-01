import { describe, expect, it } from "vitest";
import { isBillableGeneration } from "../ai/generation-record";
import { createMockStore } from "./store";

const baseInput = {
  copied: false,
  extraInfo: "",
  generationType: "moments" as const,
  modelName: "test-model",
  modelProvider: "mock",
  phone: "test-user",
  planName: "standard_monthly" as const,
  projectName: "页面体检",
  prompt: "prompt",
  purpose: "提升信任",
  result: "legacy result",
  sensitiveCheckResult: "未发现明显高风险表达。",
  storeName: "测试门店",
  storeType: "本地门店",
  targetCustomer: "本地门店老板",
  usedStoreProfile: false,
  userId: "user_test",
  userNote: "",
};

describe("generation diagnostic persistence", () => {
  it("normalizes an old create input as a legacy record", () => {
    const record = createMockStore().createGeneration(baseInput);

    expect(record).toMatchObject({
      cleanedContent: "",
      errorCode: "",
      rawResponse: "",
      status: "legacy",
    });
  });

  it("preserves failed diagnostics and excludes failed records from usage", () => {
    const record = createMockStore().createGeneration({
      ...baseInput,
      errorCode: "timeout",
      errorMessage: "模型服务请求超时。",
      requestId: "request_test",
      status: "failed",
    });

    expect(record.status).toBe("failed");
    expect(record.errorCode).toBe("timeout");
    expect(isBillableGeneration(record)).toBe(false);
  });
});
