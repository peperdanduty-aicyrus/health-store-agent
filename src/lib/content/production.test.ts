import { describe, expect, it } from "vitest";
import { buildContentFactPrompt, contentLabels, copyableContent, generateContentDraft, rewriteStaysWithinFacts } from "./production";
import type { ContentFacts } from "./production";

const now = "2026-07-12T00:00:00.000Z";
const facts: ContentFacts = {
  client: { id: "c", clientName: "真实客户", brandName: "安静品牌", industry: "", city: "沈阳", serviceArea: "和平区", contactName: "", contactMethod: "", address: "", companyIntro: "只提供日常咨询", mainBusiness: "基础服务", targetAudience: "本地居民", businessHours: "", customerSource: "", cooperationStatus: "合作中", notes: "", active: true, createdAt: now, updatedAt: now },
  profile: { id: "p", organizationId: "o", detailedIntro: "真实资料", services: "基础服务", realAdvantages: "耐心沟通", teamInfo: "", qualifications: "", faq: "", audienceConcerns: "", writingStyle: "平和", prohibitedClaims: "", bannedWords: "根治,第一", referenceAccounts: "", keywords: "", usedKeywords: "", createdAt: now, updatedAt: now },
  task: { id: "t", clientId: "c", organizationId: "o", contentType: "official_article", titleDirection: "日常咨询", topic: "真实服务说明", targetAudience: "", primaryKeyword: "咨询", secondaryKeywords: "", plannedGenerationDate: "2026-07-12", plannedPublishDate: "", generationCount: 0, status: "待生成", assignedUserId: "u", notes: "", createdAt: now, updatedAt: now }, styleSamples: [],
};

describe("content production safety", () => {
  it("defines all five independent content types and uses only factual packet data", () => {
    expect(Object.keys(contentLabels)).toHaveLength(5);
    const prompt = buildContentFactPrompt(facts);
    expect(prompt).toContain("安静品牌");
    expect(prompt).toContain("不得编造");
    expect(prompt).not.toContain("monthlyFee");
  });
  it("rejects rewrites that introduce a new numeric claim", () => {
    expect(rewriteStaysWithinFacts({ title: "说明", summary: "", body: "已有 1 项服务", faq: "", seoTitle: "", seoDescription: "", suggestedKeywords: "" }, { title: "说明", summary: "", body: "已有 3 项服务", faq: "", seoTitle: "", seoDescription: "", suggestedKeywords: "" })).toBe(false);
  });
  it("keeps copy output free of display labels", () => {
    expect(copyableContent({ title: "标题：内容", summary: "摘要：说明", body: "正文：正文", faq: "FAQ：问答", seoTitle: "SEO标题：", seoDescription: "SEO描述：" })).toBe("内容\n\n说明\n\n正文\n\n问答");
  });
  it("records a safe failure rather than returning a partial draft", async () => {
    const result = await generateContentDraft(facts, { generate: async () => ({ content: "not json", model: "test", prompt: "", provider: "mock" }) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.publicMessage).toContain("生成内容格式异常");
  });
});
