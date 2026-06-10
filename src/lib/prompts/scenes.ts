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
    "要求：不夸大疗效，不承诺效果，不默认写电话、微信、详细地址。",
    `输出结构：${getOutputStructure(scene)}`,
  ].join("\n");
}

export function getOutputStructure(scene: SceneKey): string {
  const structures: Record<SceneKey, string> = {
    xiaohongshu: "5 个小红书标题、3 个封面文字、1 篇正文、8 个标签、评论区引导话术、敏感词风险检查",
    moments: "3 条短朋友圈文案、2 条长朋友圈文案、3 个配图建议、结尾咨询引导、敏感词风险检查",
    official_account: "3 个公众号标题、文章开头、3 个正文小标题、结尾预约 / 咨询引导、敏感词风险检查",
    meituan_dianping: "团单标题 5 个版本、团单副标题 3 个版本、适合人群、项目亮点、购买须知、到店转化话术、敏感词风险检查",
    review_reply: "5 条不同语气的顾客好评文案，每条 80 字以内，敏感词风险检查",
    private_domain: "针对价格、效果、距离、犹豫、优惠等常见问题生成微信回复话术，敏感词风险检查",
  };

  return structures[scene];
}

