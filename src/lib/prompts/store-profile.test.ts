import { describe, expect, it } from "vitest";
import { buildStoreProfileSummaryPrompt } from "./store-profile";

describe("store profile summary prompt", () => {
  it("asks for a compact compliant store profile summary JSON object", () => {
    const prompt = buildStoreProfileSummaryPrompt({
      extractedText: "春和中医馆主营肩颈调理、艾灸、小儿推拿。营业时间 9:00-20:00。",
      storeProfile: {
        cityArea: "北京朝阳",
        mainProjects: "肩颈调理、艾灸",
        storeAdvantages: "社区老客多",
        storeName: "春和中医馆",
        storeType: "中医馆 / 中医诊所",
      },
    });

    expect(prompt).toContain("只输出一个合法 JSON 对象");
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain("【店铺基础信息】");
    expect(prompt).toContain("【可用于生成文案的店铺关键词】");
    expect(prompt).toContain("800-1500 字以内");
    expect(prompt).toContain("商户粘贴的店铺原始资料如下：");
    expect(prompt).not.toContain("PDF");
    expect(prompt).toContain("根治、治愈、保证有效、百分百、第一、最有效、永久、无副作用、包好、神医、祖传秘方、治疗疾病");
  });
});
