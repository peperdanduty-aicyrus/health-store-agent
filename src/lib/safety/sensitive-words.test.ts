import { describe, expect, it } from "vitest";
import { replaceSensitiveWords, scanSensitiveWords } from "./sensitive-words";

describe("sensitive word scanner", () => {
  it("detects high-risk health and advertising expressions", () => {
    const result = scanSensitiveWords("本项目可以根治肩颈问题，立竿见影，无副作用，还是全城最低。");

    expect(result.detectedWords).toEqual(["根治", "立竿见影", "无副作用", "全城最低"]);
    expect(result.hasRisk).toBe(true);
    expect(result.message).toContain("检测到可能存在风险表达");
    expect(result.suggestions).toContain("日常调理");
    expect(result.suggestions).toContain("体验因人而异");
  });

  it("deduplicates repeated sensitive words", () => {
    const result = scanSensitiveWords("治愈不是承诺，不能写治愈。");

    expect(result.detectedWords).toEqual(["治愈"]);
  });

  it("detects xiaohongshu traffic diversion terms and added medical risk terms", () => {
    const result = scanSensitiveWords("无痛胃肠镜可以加微信了解，也可以扫码进群免费领取资料。");

    expect(result.detectedWords).toEqual(["无痛", "加微信", "微信", "扫码", "进群", "免费领取"]);
    expect(result.suggestions).toContain("舒适化检查");
    expect(result.suggestions).toContain("想了解可以留言");
  });

  it("returns a no-obvious-risk message when nothing matches", () => {
    const result = scanSensitiveWords("建议到店评估，具体情况因人而异，内容仅作科普参考。");

    expect(result.detectedWords).toEqual([]);
    expect(result.hasRisk).toBe(false);
    expect(result.message).toBe("敏感词风险检查：未发现明显高风险表达，请发布前结合实际情况人工确认。");
  });

  it("replaces risky words with safer publishable wording", () => {
    const result = replaceSensitiveWords("无痛肩颈根治体验，马上见效，加微信了解，全城最低。");

    expect(result.content).toBe("舒适化肩颈日常调理体验，体验因人而异，留言了解，优惠体验价。");
    expect(result.replacements).toEqual([
      { from: "无痛", to: "舒适化" },
      { from: "根治", to: "日常调理" },
      { from: "马上见效", to: "体验因人而异" },
      { from: "加微信", to: "留言了解" },
      { from: "全城最低", to: "优惠体验价" },
    ]);
  });
});
