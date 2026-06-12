import { describe, expect, it } from "vitest";
import { buildScenePrompt, type GenerationInput, type StoreProfileForPrompt } from "./scenes";

const storeProfile: StoreProfileForPrompt = {
  cityArea: "北京朝阳",
  mainProjects: "三伏贴、艾灸、肩颈调理",
  storeAdvantages: "社区老客多，医生沟通细致",
  storeName: "春和中医馆",
  storeType: "中医馆 / 中医诊所",
};

const input: GenerationInput = {
  extraInfo: "周末活动",
  projectName: "三伏贴",
  purpose: "引流咨询",
  targetCustomer: "上班族",
};

describe("scene prompt builder", () => {
  it("requires clean JSON output without Markdown formatting symbols", () => {
    const prompt = buildScenePrompt("moments", storeProfile, input);

    expect(prompt).toContain("只输出一个合法 JSON 对象");
    expect(prompt).toContain("不要使用 Markdown 符号");
    expect(prompt).toContain("#、##、*、**、---");
    expect(prompt).toContain("朋友圈场景不要输出任何 # 标签");
  });

  it("limits xiaohongshu tags to the final tags array", () => {
    const prompt = buildScenePrompt("xiaohongshu", storeProfile, input);

    expect(prompt).toContain('"tags"');
    expect(prompt).toContain("标签最多 6 个");
    expect(prompt).toContain("标签只允许出现在 tags 字段");
  });
});
