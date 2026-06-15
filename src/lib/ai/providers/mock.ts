import type { SceneKey } from "../../domain/scenes";
import type { GenerationInput, StoreProfileForPrompt } from "../../prompts/scenes";
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
  return {
    content: JSON.stringify(buildMockSceneBody(scene, storeProfile, input), null, 2),
    model: "mock-health-copywriter",
    prompt,
    provider: "mock",
  };
}

function buildMockSceneBody(scene: SceneKey, storeProfile: StoreProfileForPrompt, input: GenerationInput) {
  const base = `${storeProfile.storeName}围绕「${input.projectName}」为${input.targetCustomer}准备了一组内容表达，重点突出真实体验、到店评估和日常养护建议。`;

  if (scene === "xiaohongshu") {
    return {
      body: base,
      commentGuide: "有相关问题可以在评论区留言，我们会结合实际情况回复。",
      coverTexts: ["到店前先问清楚", "适合自己的才重要", "日常养护小提醒"],
      sensitiveCheck: [],
      tags: ["本地健康", "日常养护", "到店评估"],
      titles: [
        `${input.projectName}适合哪些人先了解？`,
        "上班族最近关注的日常调理小事",
        "到店前可以先问清楚这 3 点",
        `${storeProfile.storeType}老板常被问到的问题`,
        `${input.projectName}体验前的温和提醒`,
      ],
    };
  }

  if (scene === "moments") {
    return {
      closingGuide: "想了解可以留言，先判断是否适合再安排到店。",
      imageIdeas: ["门店环境", "项目准备", "日常科普图"],
      longPosts: [base],
      sensitiveCheck: [],
      shortPosts: [`${input.projectName}最近咨询的人不少，建议先了解清楚再决定。`, base],
    };
  }

  if (scene === "official_account") {
    return {
      closingGuide: "如需进一步了解，可以留言说明自己的情况。",
      intro: `最近不少${input.targetCustomer}咨询${input.projectName}，这篇用简单方式讲清楚适合场景、注意事项和到店前准备。`,
      sections: [
        { body: base, heading: "适合先了解的人群" },
        { body: "到店前建议先说明自己的基础情况。", heading: "到店前准备" },
        { body: "具体体验因人而异，方案以评估为准。", heading: "注意事项" },
      ],
      sensitiveCheck: [],
      titles: [`${input.projectName}到店前先看这篇`, `${input.targetCustomer}常问的几个问题`, "日常养护先从了解开始"],
    };
  }

  if (scene === "meituan_dianping") {
    return {
      conversionScript: "到店前建议先确认时间和适合情况。",
      highlights: ["流程清楚", "先评估再安排", "体验因人而异"],
      purchaseNotes: ["下单前建议先确认可预约时间", "具体方案以到店评估为准"],
      sensitiveCheck: [],
      subtitles: [`适合${input.targetCustomer}先了解`, "到店评估后再安排"],
      targetUsers: [input.targetCustomer],
      titles: [`${input.projectName}到店体验`, `${storeProfile.storeName}${input.projectName}`, `${input.projectName}日常养护参考`],
    };
  }

  if (scene === "review_reply") {
    return {
      reviews: ["环境舒服，沟通也很细致，整体体验比较安心。", "到店前问的问题都有人耐心解答，流程比较清楚。", "适合想先了解再决定的朋友，体验感不错。"],
      sensitiveCheck: [],
    };
  }

  if (scene === "douyin_kuaishou") {
    return {
      commentGuides: [
        "想看附近门店怎么选，可以在评论区说一下。",
        "有类似不适感可以先了解，不建议盲目办卡。",
        "想了解门店活动，可以留言说项目名称。",
        "不确定是否适合，可以先把大概情况说清楚。",
        "到店前建议先问清楚流程、时间和注意事项。",
      ],
      script15: {
        endingGuide: "结尾提醒先咨询是否适合，再预约到店体验。",
        middleDisplay: `展示${storeProfile.storeName}的环境、服务流程和${input.projectName}准备细节。`,
        opening3Seconds: `${input.targetCustomer}最近如果总觉得状态紧，可以先了解这个日常养护项目。`,
      },
      script30: {
        spokenCopy: `${input.targetCustomer}如果想了解${input.projectName}，建议先看门店环境、流程和沟通是否清楚。我们会先了解基础情况，再建议是否适合到店体验。具体感受因人而异，以实际体验为准。`,
        subtitleSuggestions: ["先了解，再决定", `${input.projectName}日常养护参考`, "到店前建议先咨询"],
        visualSuggestions: ["门店门头和接待区", "项目准备过程", "店员和顾客沟通细节"],
      },
      sensitiveCheck: [],
      spokenCopy: `${input.projectName}不是每个人都要马上安排，先把自己的情况说清楚，再看是否适合到店了解。我们更希望你明明白白体验，不要冲动办卡。`,
      subtitleCopy: [`${input.projectName}先别急着办卡`, "先问清楚适不适合", "流程、时间、注意事项都要了解", "实际体验因人而异", "需要的话可以先留言咨询"].join("\n"),
      videoTitles: [
        `${input.projectName}到店前先问这 3 点`,
        `${input.targetCustomer}可以先了解的日常养护项目`,
        `${storeProfile.storeType}老板常被问的问题`,
        `${input.projectName}体验前的小提醒`,
        "附近门店别急着选，先看流程清不清楚",
      ],
    };
  }

  return {
    followUp: "如果方便，可以先说下大概情况，我们再判断是否适合到店。",
    replies: [
      {
        answer: "可以先简单说下您的情况，我们帮您判断是否适合到店评估，不建议没了解清楚就直接安排。",
        question: "这个适合我吗？",
      },
    ],
    sensitiveCheck: [],
  };
}
