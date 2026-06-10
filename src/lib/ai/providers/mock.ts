import { sceneDefinitions, type SceneKey } from "../../domain/scenes";
import { getOutputStructure, type GenerationInput, type StoreProfileForPrompt } from "../../prompts/scenes";
import type { GenerateContentResult } from "../provider";

type MockProviderInput = {
  input: GenerationInput;
  prompt: string;
  scene: SceneKey;
  storeProfile: StoreProfileForPrompt;
  userId: string;
};

export async function generateWithMockProvider({
  input,
  prompt,
  scene,
  storeProfile,
}: MockProviderInput): Promise<GenerateContentResult> {
  const sceneLabel = sceneDefinitions[scene].label;

  return {
    content: [
      `【${sceneLabel}】${storeProfile.storeName} - ${input.projectName}`,
      "",
      `输出结构：${getOutputStructure(scene)}`,
      "",
      `门店：${storeProfile.storeName}（${storeProfile.cityArea}）`,
      `目标客户：${input.targetCustomer}`,
      `宣传目的：${input.purpose}`,
      `补充信息：${input.extraInfo || "无"}`,
      "",
      "示例内容：",
      buildMockSceneBody(scene, storeProfile, input),
      "",
      "敏感词风险检查：未发现明显高风险表达，请发布前结合实际情况人工确认。",
    ].join("\n"),
    model: "mock-health-copywriter",
    prompt,
    provider: "mock",
  };
}

function buildMockSceneBody(scene: SceneKey, storeProfile: StoreProfileForPrompt, input: GenerationInput): string {
  const base = `${storeProfile.storeName}围绕「${input.projectName}」为${input.targetCustomer}准备了一组内容表达，重点突出真实体验、到店评估和日常养护建议。`;

  if (scene === "xiaohongshu") {
    return `5 个小红书标题：\n1. ${input.projectName}适合哪些人先了解？\n2. 上班族最近关注的日常调理小事\n3. 到店前可以先问清楚这 3 点\n4. ${storeProfile.storeType}老板常被问到的问题\n5. ${input.projectName}体验前的温和提醒\n\n正文：${base}`;
  }

  if (scene === "moments") {
    return `短朋友圈：${base}\n想了解可以私信我，先判断是否适合再安排到店。`;
  }

  if (scene === "official_account") {
    return `文章开头：最近不少${input.targetCustomer}咨询${input.projectName}，这篇用简单方式讲清楚适合场景、注意事项和到店前准备。\n\n${base}`;
  }

  if (scene === "meituan_dianping") {
    return `团单标题：${input.projectName}到店体验｜适合${input.targetCustomer}\n项目亮点：流程清楚、先评估、体验因人而异。\n购买须知：下单前建议先确认时间。`;
  }

  if (scene === "review_reply") {
    return `1. 环境舒服，沟通也很细致，整体体验比较安心。\n2. 到店前问的问题都有人耐心解答，流程比较清楚。\n3. 适合想先了解再决定的朋友，体验感不错。`;
  }

  return `顾客问：这个适合我吗？\n回复：可以先简单说下您的情况，我们帮您判断是否适合到店评估，不建议没了解清楚就直接安排。`;
}

