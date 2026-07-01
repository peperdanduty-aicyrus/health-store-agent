import type { SceneKey } from "../domain/scenes";
import { validateAndCleanSceneOutput } from "./output-safety";
import type { StructuredSceneOutput, StructuredValue } from "./scene-schemas";

const labels: Record<string, string> = {
  answer: "回复",
  body: "正文",
  closingGuide: "结尾引导",
  commentGuides: "评论区引导话术",
  commentGuide: "评论区引导",
  conversionScript: "到店转化话术",
  coverTexts: "封面文字",
  followUp: "跟进话术",
  heading: "小标题",
  highlights: "项目亮点",
  imageIdeas: "配图建议",
  intro: "文章开头",
  longPosts: "长朋友圈",
  purchaseNotes: "购买须知",
  question: "问题",
  replies: "回复话术",
  reviews: "好评话术",
  sections: "正文段落",
  script15: "15 秒短视频脚本",
  script30: "30 秒短视频脚本",
  shortPosts: "短朋友圈",
  spokenCopy: "口播文案",
  middleDisplay: "中间展示",
  opening3Seconds: "开头 3 秒",
  endingGuide: "结尾引导",
  subtitleCopy: "视频字幕版文案",
  subtitleSuggestions: "字幕建议",
  subtitles: "副标题",
  tags: "标签",
  targetUsers: "适合人群",
  titles: "标题",
  videoTitles: "短视频标题",
  visualSuggestions: "画面建议",
};

export type GenerationPresentation =
  | {
      displayable: true;
      cleanedContent: string;
      copyText: string;
      structuredContent: StructuredSceneOutput;
    }
  | {
      displayable: false;
      cleanedContent: "";
      copyText: "";
      message: string;
      structuredContent: null;
    };

export function prepareGenerationPresentation(scene: SceneKey, content: string): GenerationPresentation {
  const safe = validateAndCleanSceneOutput({ rawResponse: content, scene });
  if (!safe.ok) {
    return {
      cleanedContent: "",
      copyText: "",
      displayable: false,
      message: "生成内容格式异常，请重新生成。",
      structuredContent: null,
    };
  }

  return {
    cleanedContent: safe.cleanedContent,
    copyText: formatStructuredContent(safe.value),
    displayable: true,
    structuredContent: safe.value,
  };
}

export function labelForGenerationKey(key: string): string {
  return labels[key] ?? key;
}

export function renderStructuredValue(value: StructuredValue): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(renderStructuredValue).join("\n");
  }
  return Object.entries(value)
    .map(([key, item]) => `${labelForGenerationKey(key)}：${renderStructuredValue(item)}`)
    .join("\n");
}

export function formatStructuredContent(content: StructuredSceneOutput): string {
  return Object.entries(content)
    .map(([key, value]) => `${labelForGenerationKey(key)}\n${renderStructuredValue(value)}`)
    .join("\n\n");
}
