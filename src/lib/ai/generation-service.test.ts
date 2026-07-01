import { describe, expect, it } from "vitest";
import type { GenerateContentResult } from "./provider";
import { generateSafeSceneContent } from "./generation-service";
import { sceneDefinitions } from "../domain/scenes";

const input = {
  input: {
    extraInfo: "",
    projectName: "线上页面体检",
    purpose: "提升信任",
    targetCustomer: "本地门店老板",
  },
  scene: "moments" as const,
  storeProfile: {
    cityArea: "沈阳",
    mainProjects: "本地生活服务",
    storeAdvantages: "真实门店",
    storeName: "测试门店",
    storeType: "本地门店",
  },
  userId: "user_test",
};

function generated(content: string, finishReason = "stop"): GenerateContentResult {
  return {
    content,
    elapsedMs: 12,
    finishReason,
    model: "test-model",
    prompt: "test prompt",
    provider: "mock",
    tokenUsage: { completion_tokens: 20, prompt_tokens: 10, total_tokens: 30 },
  };
}

describe("safe generation service", () => {
  it("accepts the paid site's mock output for every supported scene", async () => {
    for (const scene of Object.keys(sceneDefinitions) as Array<keyof typeof sceneDefinitions>) {
      const result = await generateSafeSceneContent({ ...input, provider: "mock", scene });
      expect(result.status, scene).toBe("success");
    }
  });

  it("returns cleaned content for a valid model response", async () => {
    const result = await generateSafeSceneContent(input, {
      generate: async () =>
        generated(
          JSON.stringify({
            shortPosts: ["短文案"],
            longPosts: ["长文案"],
            imageIdeas: ["门店环境"],
            closingGuide: "先看看问题在哪。",
          }),
        ),
    });

    expect(result).toMatchObject({ status: "success", finishReason: "stop" });
    if (result.status === "success") {
      expect(result.cleanedContent).toContain("短文案");
      expect(result.rawResponse).toContain("shortPosts");
    }
  });

  it("marks unsafe model output as failed and provides only a safe public message", async () => {
    const rawResponse = "```html\n<script>alert(1)</script>\n```";
    const result = await generateSafeSceneContent(input, { generate: async () => generated(rawResponse) });

    expect(result).toMatchObject({
      errorCode: "markdown_code_block",
      publicMessage: "生成内容格式异常，请重新生成。",
      status: "failed",
    });
    expect(result.rawResponse).toBe(rawResponse);
    expect(result).not.toHaveProperty("cleanedContent");
  });

  it("classifies provider failures without exposing their message publicly", async () => {
    const result = await generateSafeSceneContent(input, {
      generate: async () => {
        throw new Error("secret upstream response and stack");
      },
    });

    expect(result).toMatchObject({ publicMessage: "生成失败，请稍后重试。", status: "failed" });
    if (result.status === "failed") {
      expect(result.publicMessage).not.toContain("upstream");
    }
  });
});
