import { sceneDefinitions, type SceneKey } from "../domain/scenes";

export type StoreProfileForPrompt = {
  storeName: string;
  storeType: string;
  cityArea: string;
  mainProjects: string;
  storeAdvantages: string;
};

export type GenerationInput = {
  projectName: string;
  targetCustomer: string;
  purpose: string;
  extraInfo: string;
};

export function buildScenePrompt(scene: SceneKey, storeProfile: StoreProfileForPrompt, input: GenerationInput): string {
  const sceneLabel = sceneDefinitions[scene].label;

  return [
    `请为本地健康门店生成${sceneLabel}。`,
    `门店名称：${storeProfile.storeName}`,
    `门店类型：${storeProfile.storeType}`,
    `城市 / 区域：${storeProfile.cityArea}`,
    `主营项目：${storeProfile.mainProjects || "未填写"}`,
    `门店优势：${storeProfile.storeAdvantages || "未填写"}`,
    `项目名称：${input.projectName}`,
    `目标客户：${input.targetCustomer}`,
    `宣传目的：${input.purpose}`,
    `补充信息：${input.extraInfo || "无"}`,
    "基础要求：不夸大疗效，不承诺效果，不默认写电话、微信、详细地址。",
    "格式强约束：请输出可直接复制发布的干净中文文本。不要使用 Markdown 符号，不要使用 #、##、*、**、--- 等格式符号，不要输出 Markdown 表格符号。",
    "输出强约束：只输出一个合法 JSON 对象，不要在 JSON 前后添加解释、标题、代码块或多余文字。",
    getSceneTagRule(scene),
    `JSON 结构：${getOutputStructure(scene)}`,
  ].join("\n");
}

export function getOutputStructure(scene: SceneKey): string {
  const structures: Record<SceneKey, string> = {
    xiaohongshu:
      '{"titles":["标题1","标题2","标题3","标题4","标题5"],"coverTexts":["封面文字1","封面文字2","封面文字3"],"body":"正文内容","tags":["标签1","标签2","标签3"],"commentGuide":"评论区引导话术"}',
    moments:
      '{"shortPosts":["短朋友圈1","短朋友圈2","短朋友圈3"],"longPosts":["长朋友圈1","长朋友圈2"],"imageIdeas":["配图建议1","配图建议2","配图建议3"],"closingGuide":"结尾咨询引导"}',
    official_account:
      '{"titles":["标题1","标题2","标题3"],"intro":"文章开头","sections":[{"heading":"小标题1","body":"正文段落1"},{"heading":"小标题2","body":"正文段落2"},{"heading":"小标题3","body":"正文段落3"}],"closingGuide":"结尾预约或咨询引导"}',
    meituan_dianping:
      '{"titles":["团单标题1","团单标题2","团单标题3","团单标题4","团单标题5"],"subtitles":["副标题1","副标题2","副标题3"],"targetUsers":["适合人群1","适合人群2"],"highlights":["项目亮点1","项目亮点2"],"purchaseNotes":["购买须知1","购买须知2"],"conversionScript":"到店转化话术"}',
    review_reply:
      '{"reviews":["好评文案1","好评文案2","好评文案3","好评文案4","好评文案5"]}',
    private_domain:
      '{"replies":[{"question":"顾客问题1","answer":"回复话术1"},{"question":"顾客问题2","answer":"回复话术2"}],"followUp":"后续跟进话术"}',
    douyin_kuaishou:
      '{"videoTitles":["短视频标题1","短视频标题2","短视频标题3","短视频标题4","短视频标题5"],"script15":{"opening3Seconds":"开头3秒怎么吸引人","middleDisplay":"中间怎么展示项目或门店","endingGuide":"结尾怎么引导咨询或到店"},"script30":{"visualSuggestions":["画面建议1","画面建议2","画面建议3"],"spokenCopy":"30秒口播文案","subtitleSuggestions":["字幕建议1","字幕建议2","字幕建议3"]},"spokenCopy":"像真人说话的口播文案","subtitleCopy":"适合直接复制到剪映字幕里的文案","commentGuides":["评论区引导话术1","评论区引导话术2","评论区引导话术3","评论区引导话术4","评论区引导话术5"]}',
  };

  return structures[scene];
}

function getSceneTagRule(scene: SceneKey): string {
  if (scene === "xiaohongshu") {
    return "小红书规则：标签最多 6 个，标签只允许出现在 tags 字段，正文、标题和封面文字中不要穿插 # 标签。";
  }

  if (scene === "douyin_kuaishou") {
    return [
      "抖音/快手规则：短视频标题 5 个，适合本地生活平台，不夸大，不违规，有真实门店感。",
      "脚本要求：15 秒短视频脚本必须包含开头 3 秒、中间展示和结尾引导；30 秒短视频脚本必须包含画面建议、口播文案和字幕建议。",
      "口播要求：像真人说话，不要太广告，不要太官方；视频字幕版文案要适合直接复制到剪映字幕里。",
      "评论区要求：输出 5 条评论区引导话术，避免强迫成交和虚假承诺。",
      "合规要求：医疗健康相关内容不能出现夸大承诺，避免使用根治、治愈、保证有效、最有效、第一、百分百、永久、无副作用、包好、神医、祖传秘方等敏感词。",
      "安全表达：优先使用调理、改善体验、缓解不适感、日常养护、辅助放松、适合了解、建议到店咨询、以实际体验为准。",
      "抖音/快手文案场景不要输出任何 # 标签。",
    ].join("\n");
  }

  const sceneLabel = scene === "moments" ? "朋友圈" : sceneDefinitions[scene].label;
  return `${sceneLabel}场景不要输出任何 # 标签。`;
}
