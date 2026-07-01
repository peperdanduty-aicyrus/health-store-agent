import { describe, expect, it } from "vitest";
import { prepareGenerationPresentation } from "./generation-presentation";

const cleanMoments = JSON.stringify({
  shortPosts: ["今天午休看了一个页面。"],
  longPosts: ["线上页面没有把主推项目说清楚。"],
  imageIdeas: ["门店环境"],
  closingGuide: "可以先看看问题在哪。",
});

describe("customer generation presentation", () => {
  it("never exposes raw content when parsing or schema validation fails", () => {
    const raw = "```html\n<script>alert('x')</script>\n```";
    const presentation = prepareGenerationPresentation("moments", raw);

    expect(presentation.displayable).toBe(false);
    expect(presentation.copyText).toBe("");
    expect(JSON.stringify(presentation)).not.toContain(raw);
  });

  it("copies only formatted cleaned content", () => {
    const presentation = prepareGenerationPresentation("moments", cleanMoments);

    expect(presentation.displayable).toBe(true);
    expect(presentation.copyText).toContain("短朋友圈");
    expect(presentation.copyText).toContain("今天午休看了一个页面。");
    expect(presentation.copyText).not.toContain("shortPosts");
  });
});
