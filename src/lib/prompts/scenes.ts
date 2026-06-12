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
      '{"titles":["标题1","标题2","标题3","标题4","标题5"],"coverTexts":["封面文字1","封面文字2","封面文字3"],"body":"正文内容","tags":["标签1","标签2","标签3"],"commentGuide":"评论区引导话术","sensitiveCheck":[]}',
    moments:
      '{"shortPosts":["短朋友圈1","短朋友圈2","短朋友圈3"],"longPosts":["长朋友圈1","长朋友圈2"],"imageIdeas":["配图建议1","配图建议2","配图建议3"],"closingGuide":"结尾咨询引导","sensitiveCheck":[]}',
    official_account:
      '{"titles":["标题1","标题2","标题3"],"intro":"文章开头","sections":[{"heading":"小标题1","body":"正文段落1"},{"heading":"小标题2","body":"正文段落2"},{"heading":"小标题3","body":"正文段落3"}],"closingGuide":"结尾预约或咨询引导","sensitiveCheck":[]}',
    meituan_dianping:
      '{"titles":["团单标题1","团单标题2","团单标题3","团单标题4","团单标题5"],"subtitles":["副标题1","副标题2","副标题3"],"targetUsers":["适合人群1","适合人群2"],"highlights":["项目亮点1","项目亮点2"],"purchaseNotes":["购买须知1","购买须知2"],"conversionScript":"到店转化话术","sensitiveCheck":[]}',
    review_reply:
      '{"reviews":["好评文案1","好评文案2","好评文案3","好评文案4","好评文案5"],"sensitiveCheck":[]}',
    private_domain:
      '{"replies":[{"question":"顾客问题1","answer":"回复话术1"},{"question":"顾客问题2","answer":"回复话术2"}],"followUp":"后续跟进话术","sensitiveCheck":[]}',
  };

  return structures[scene];
}

function getSceneTagRule(scene: SceneKey): string {
  if (scene === "xiaohongshu") {
    return "小红书规则：标签最多 6 个，标签只允许出现在 tags 字段，正文、标题和封面文字中不要穿插 # 标签。";
  }

  const sceneLabel = scene === "moments" ? "朋友圈" : sceneDefinitions[scene].label;
  return `${sceneLabel}场景不要输出任何 # 标签。`;
}
