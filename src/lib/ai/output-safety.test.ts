import { describe, expect, it } from "vitest";
import { validateAndCleanSceneOutput } from "./output-safety";

const validMoments = JSON.stringify({
  shortPosts: ["今天午休看了一个页面，主推项目不够清楚。"],
  longPosts: ["今天午休顺手看了一个本地门店页面。线下做得怎么样我不知道，但线上表达确实有点吃亏。"],
  imageIdeas: ["门店环境实拍"],
  closingGuide: "想先看看问题在哪，可以把页面发给我。",
});

describe("AI scene output safety", () => {
  it("accepts and canonicalizes a valid scene payload", () => {
    const result = validateAndCleanSceneOutput({ rawResponse: validMoments, scene: "moments" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.cleanedContent)).toEqual(JSON.parse(validMoments));
    }
  });

  it.each([
    ["Markdown code block", `\`\`\`json\n${validMoments}\n\`\`\``, "markdown_code_block"],
    ["HTML", JSON.stringify({ ...JSON.parse(validMoments), closingGuide: "<div>联系我</div>" }), "unsafe_html"],
    ["JSON error object", JSON.stringify({ error: "provider unavailable", status: 500 }), "error_object"],
    [
      "error stack",
      JSON.stringify({ ...JSON.parse(validMoments), closingGuide: "TypeError: failed\n    at generate (/app/actions.ts:10:3)" }),
      "stack_trace",
    ],
    ["unknown field", JSON.stringify({ ...JSON.parse(validMoments), html: "unexpected" }), "schema_invalid"],
    ["empty response", "   ", "empty_response"],
    ["truncated JSON", '{"shortPosts":["未完成"],"longPosts":', "truncated_response"],
  ])("rejects %s", (_label, rawResponse, errorCode) => {
    const result = validateAndCleanSceneOutput({ rawResponse, scene: "moments" });

    expect(result).toMatchObject({ errorCode, ok: false });
  });

  it("rejects content when the provider reports a length truncation", () => {
    const result = validateAndCleanSceneOutput({
      finishReason: "length",
      rawResponse: validMoments,
      scene: "moments",
    });

    expect(result).toMatchObject({ errorCode: "truncated_response", ok: false });
  });

  it("rejects code and system prompt leakage inside otherwise valid fields", () => {
    const codeResult = validateAndCleanSceneOutput({
      rawResponse: JSON.stringify({ ...JSON.parse(validMoments), closingGuide: "const result = function generate() {}" }),
      scene: "moments",
    });
    const promptLeakResult = validateAndCleanSceneOutput({
      rawResponse: JSON.stringify({ ...JSON.parse(validMoments), closingGuide: "以下是系统提示词 system prompt" }),
      scene: "moments",
    });

    expect(codeResult).toMatchObject({ errorCode: "code_content", ok: false });
    expect(promptLeakResult).toMatchObject({ errorCode: "system_prompt_leak", ok: false });
  });
});
