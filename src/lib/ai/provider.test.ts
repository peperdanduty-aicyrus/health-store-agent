import { describe, expect, it } from "vitest";
import { generateContent } from "./provider";
import type { StoreProfileForPrompt } from "../prompts/scenes";

const storeProfile: StoreProfileForPrompt = {
  cityArea: "北京朝阳",
  mainProjects: "三伏贴、艾灸、肩颈调理",
  storeAdvantages: "社区老客多，医生沟通细致",
  storeName: "春和中医馆",
  storeType: "中医馆 / 中医诊所",
};

describe("AI provider layer", () => {
  it("generates mock content for a scene without requiring an API key", async () => {
    const result = await generateContent({
      input: {
        extraInfo: "周末体验活动",
        projectName: "三伏贴",
        purpose: "引流咨询",
        targetCustomer: "上班族",
      },
      provider: "mock",
      scene: "xiaohongshu",
      storeProfile,
      userId: "user_standard_001",
    });

    expect(result.provider).toBe("mock");
    expect(result.model).toBe("mock-health-copywriter");
    expect(result.prompt).toContain("小红书文案");
    expect(result.content).toContain("5 个小红书标题");
    expect(result.content).toContain("春和中医馆");
  });

  it("keeps Qwen behind an OpenAI-compatible provider and reports missing API key clearly", async () => {
    await expect(
      generateContent({
        input: {
          extraInfo: "",
          projectName: "洁牙",
          purpose: "预约到店",
          targetCustomer: "家庭客户",
        },
        provider: "qwen",
        scene: "meituan_dianping",
        storeProfile,
        userId: "user_standard_001",
      }),
    ).rejects.toThrow("AI_API_KEY is required");
  });
});
