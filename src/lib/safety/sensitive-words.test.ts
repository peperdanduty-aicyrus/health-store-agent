import { describe, expect, it } from "vitest";
import { scanSensitiveWords } from "./sensitive-words";

describe("sensitive word scanner", () => {
  it("detects high-risk health and advertising expressions", () => {
    const result = scanSensitiveWords("本项目可以根治肩颈问题，立竿见影，无副作用，还是全城最低价。");

    expect(result.detectedWords).toEqual(["根治", "立竿见影", "无副作用", "全城最低价"]);
    expect(result.hasRisk).toBe(true);
    expect(result.message).toContain("检测到可能存在风险表达");
    expect(result.suggestions).toContain("日常调理");
    expect(result.suggestions).toContain("体验因人而异");
  });

  it("deduplicates repeated sensitive words", () => {
    const result = scanSensitiveWords("治愈不是承诺，不能写治愈。");

    expect(result.detectedWords).toEqual(["治愈"]);
  });

  it("returns a no-obvious-risk message when nothing matches", () => {
    const result = scanSensitiveWords("建议到店评估，具体情况因人而异，内容仅作科普参考。");

    expect(result.detectedWords).toEqual([]);
    expect(result.hasRisk).toBe(false);
    expect(result.message).toBe("敏感词风险检查：未发现明显高风险表达，请发布前结合实际情况人工确认。");
  });
});
