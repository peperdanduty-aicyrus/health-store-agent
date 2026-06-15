import type { SceneKey } from "../domain/scenes";
import type { WorkbenchGenerationType } from "../data/types";
import { buildScenePrompt, type GenerationInput, type StoreProfileForPrompt } from "../prompts/scenes";
import { buildWorkbenchPrompt, type WorkbenchInput } from "../prompts/workbench";
import { generateWithDeepSeek } from "./providers/deepseek";
import { generateWithMockProvider } from "./providers/mock";
import { generateWithQwen } from "./providers/qwen";

export type AiProvider = "mock" | "qwen" | "deepseek" | "openai-compatible";

export type GenerateContentInput = {
  input: GenerationInput;
  provider?: AiProvider;
  scene: SceneKey;
  storeProfile: StoreProfileForPrompt;
  userId: string;
};

export type GenerateContentResult = {
  content: string;
  model: string;
  prompt: string;
  provider: AiProvider;
};

export type GenerateWorkbenchContentInput = {
  input: WorkbenchInput;
  provider?: AiProvider;
  type: WorkbenchGenerationType;
};

export async function generateContent({
  input,
  provider = readProviderFromEnv(),
  scene,
  storeProfile,
  userId,
}: GenerateContentInput): Promise<GenerateContentResult> {
  const prompt = buildScenePrompt(scene, storeProfile, input);

  if (provider === "mock") {
    return generateWithMockProvider({ input, prompt, scene, storeProfile, userId });
  }

  if (provider === "qwen") {
    return generateWithQwen({ prompt });
  }

  if (provider === "deepseek") {
    return generateWithDeepSeek({ prompt });
  }

  return generateWithQwen({ prompt, provider: "openai-compatible" });
}

export async function generateWorkbenchContent({
  input,
  provider = readProviderFromEnv(),
  type,
}: GenerateWorkbenchContentInput): Promise<GenerateContentResult> {
  const prompt = buildWorkbenchPrompt(type, input);

  if (provider === "mock") {
    return {
      content: JSON.stringify(buildMockWorkbenchBody(type, input), null, 2),
      model: "mock-workbench-copywriter",
      prompt,
      provider: "mock",
    };
  }

  if (provider === "qwen") {
    return generateWithQwen({ prompt });
  }

  if (provider === "deepseek") {
    return generateWithDeepSeek({ prompt });
  }

  return generateWithQwen({ prompt, provider: "openai-compatible" });
}

function readProviderFromEnv(): AiProvider {
  const provider = process.env.AI_PROVIDER;
  if (provider === "qwen" || provider === "deepseek" || provider === "openai-compatible") {
    return provider;
  }
  return "mock";
}

function buildMockWorkbenchBody(type: WorkbenchGenerationType, input: WorkbenchInput) {
  if (type === "mealbox_video") {
    const storeType = input.storeType || "本地门店";
    const issue = input.storeIssue || "线上页面不够清楚";
    return {
      videoTitles: [
        "午休顺手看店，这个页面有点可惜",
        `医院午休 10 分钟，看一个${storeType}页面`,
        "饭后拿起手机，看看本地门店线上问题",
      ],
      openingShots: ["医院食堂饭菜扫一眼，字幕写今天午休又看店。", "拍工牌、饭盒、手机放在桌边，节奏像日常记录。"],
      storyboard: [
        {
          duration: "2-3秒",
          shot: "镜头1",
          visual: "医院食堂或饭菜一带而过，不刻意摆拍。",
          voiceover: "今天午休吃得简单，顺手看一个本地门店页面。",
        },
        {
          duration: "2-3秒",
          shot: "镜头2",
          visual: "拿起手机，准备切到录屏。",
          voiceover: "不是做培训，就是看一个挺常见的问题。",
        },
        {
          duration: "8-15秒",
          shot: "镜头3",
          visual: "手机录屏展示打码后的门店页面。",
          voiceover: `这是一家${storeType}，名字和隐私都打码。`,
        },
        {
          duration: "8-15秒",
          shot: "镜头4",
          visual: "圈出标题、主图或团单区域。",
          voiceover: `我觉得最可惜的是：${issue}。`,
        },
        {
          duration: "8-15秒",
          shot: "镜头5",
          visual: "切到建议文字或页面重点区域。",
          voiceover: "先把主推项目和客户下一步要做什么讲清楚。",
        },
        {
          duration: "3-5秒",
          shot: "镜头6",
          visual: "回到午休桌面或手机收尾。",
          voiceover: "如果你也想知道自己页面卡在哪，可以发我看看。",
        },
      ],
      voiceoverScript: `今天午休的时候，顺手看了一个${storeType}页面。技术好不好我不知道，但线上展示确实有点吃亏。客户点进去第一眼，如果看不懂你主推什么，也不知道为什么选你，就很容易划走。这个页面我只讲一个问题：${issue}。先把这个点改清楚，比一上来堆很多平台更实际。`,
      screenRecordingScript: "录屏的时候记得把店名、头像、电话和评价里的隐私打码。讲解只围绕一个问题：客户第一眼看不懂什么，再给一个能马上改的建议。",
      endingGuides: ["我不一定说得全对，但这个问题很多店都有。", "想看自己页面有没有类似问题，可以发我看看。"],
      pinnedComments: ["店名和隐私记得打码，我这里只讲页面问题。"],
      momentsPosts: ["今天午休顺手看了一个本地门店页面。老板不一定是不专业，是线上没表达出来。"],
      xiaohongshuPost: `午休看店第 1 条：很多本地门店不是没流量，而是页面没把人留下来。今天这个${storeType}主要问题是${issue}，建议先改标题、主图、团单和承接路径。`,
    };
  }

  if (type === "promotion_copy") {
    return buildMockPromotionBody(input);
  }

  if (type === "poster_prompt") {
    const topic = priceText(input, input.mainContent || "基础体检");
    const usageScene = input.usageScene || "朋友圈海报";
    const layoutAdvice = getLayoutAdvice(usageScene);
    return {
      posterCopySets: [
        {
          bottomGuide: "底部引导语：想知道你家页面问题在哪，可以先发我看一眼",
          imagePrompt: `AI作图提示词：真实本地门店线上体检海报，主题为${topic}`,
          layoutAdvice: `排版建议：${layoutAdvice}`,
          mainTitle: "大标题：中医馆老板，别让线上页面劝退客户",
          sellingPoint1: "卖点1：先看标题和主图有没有吸引力",
          sellingPoint2: "卖点2：再看团单是不是让客户看得懂",
          sellingPoint3: "卖点3：最后看评价和私域有没有承接",
          subtitle: "副标题：午休顺手看了几家店，问题都差不多",
          usageScene,
        },
      ],
      imagePrompts: [
        {
          background: "背景环境：医院午休桌面和手机页面元素，整体真实生活化",
          caution: "注意事项：不要出现真实商标，不要出现夸张医疗承诺，不要出现具体店名。",
          colors: "颜色：白底黑字，搭配绿色或橙色重点色",
          mainTitle: "主标题：中医馆老板，别让线上页面劝退客户",
          name: "AI作图提示词1",
          ratio: usageScene.includes("朋友圈") ? "比例：3:4 或 1:1" : "比例：3:4",
          style: "风格：真实接地气，适合本地门店老板看懂",
          subtitle: "副标题：午休顺手看了几家店，问题都差不多",
          textArea: "文字区域：上方放大标题，中部放三条卖点，底部放轻引导",
          visualSubject: "画面主体：手机里的打码门店页面和运营检查笔记",
        },
      ],
    };
  }

  return {
    dailyRecordPosts: ["今天午休又看了几个门店页面。饭菜一般，页面问题倒是挺典型。"],
    problemObservationPosts: ["很多店不是没技术，是线上页面没讲清楚。客户点进去第一眼不知道你主推什么。"],
    softPromotionPosts: ["最近可以帮本地门店做一次基础体检。先看问题，再决定要不要改。"],
    privateChatPosts: ["想知道自己店铺问题在哪，可以把链接发我看看。"],
    conversionPosts: ["如果你想认真改，我可以帮你做完整检查和修改方案。"],
    imageTextIdeas: ["先看问题，再决定要不要改", "不是没客户，是页面没留住客户"],
  };
}

function buildMockPromotionBody(input: WorkbenchInput) {
  const product = priceText(input, input.product || "基础体检");
  const target = input.targetCustomer || "本地门店老板";
  const pain = input.customerPain || "不知道线上页面哪里有问题";
  const platform = input.publishPlatform || "朋友圈";
  const base = `今天午休的时候，顺手看了几个本地门店的线上页面。${target}不一定是不专业，是线上没把重点表达出来。客户点进去第一眼，如果不知道你主推什么，也不知道为什么选你，这个地方就挺吃亏。`;

  if (platform === "抖音") {
    return {
      douyinDmScripts: ["可以把页面发我，我先看标题、主图和团单这几个地方。", "先不用急着改很多东西，先看最卡人的一个问题。", "你把链接发来，我按客户第一眼看到的顺序帮你看。"],
      douyinHooks: ["午休顺手看店，发现一个常见问题。", "这个页面不是不能做，是没说清楚。", "客户第一眼看不懂，就容易划走。", "今天只讲一个线上页面问题。", "本地门店线上展示，别先急着投流。"],
      douyinPinnedComments: ["店名和隐私都记得打码，我这里只讲页面问题。", "想看自己页面，可以先从标题和主图开始。", "不承诺结果，先看问题。"],
      douyinScripts: [
        `${base}这条只讲一个问题：${pain}。先把页面说清楚，再考虑后面的推广。`,
        `我今天看的这个页面，线下可能做得不差，但线上入口有点可惜。先做${product}，把客户第一眼看不懂的地方找出来。`,
      ],
      douyinTitles: ["午休顺手看店，页面有点可惜", "本地门店别先急着投流", "客户第一眼看不懂怎么办", "一个很常见的门店页面问题", "线上页面不是越满越好", "主推项目要先说清楚", "今天只看一个问题", "门店页面先做减法", "老板不是不会做，是没表达出来", "先看问题，再决定怎么改"],
    };
  }

  if (platform === "视频号") {
    return {
      videoChannelCommentReplies: ["可以先把页面发我看一眼。", "我一般先看标题、主图、团单和承接路径。", "不一定说得全对，但能先帮你找明显问题。"],
      videoChannelMomentsPosts: ["今天午休顺手看了几个本地门店页面，很多问题都卡在第一眼没说清楚。", "门店线下做得好，不代表线上页面就能让客户看懂。", "先把页面主推项目讲明白，比急着发很多内容更重要。"],
      videoChannelScripts: [
        `${base}视频号这条我只讲一个点：页面要让客户第一眼知道你是做什么、主推什么、下一步该怎么找你。`,
        `今天午休看页面时，我发现${pain}这个问题挺常见。先看清楚问题，再决定要不要进一步改。`,
      ],
      videoChannelTitles: ["午休看店：页面先说清楚", "本地门店线上展示别吃亏", "客户第一眼看不懂就可惜了", "今天只拆一个页面问题", "主推项目别藏太深", "门店页面要有重点", "线上页面不是资料堆满", "先看问题再谈优化", "老板不一定是不专业", "把页面讲明白很重要"],
    };
  }

  if (platform === "小红书") {
    return {
      xiaohongshuCommentGuides: ["可以先从页面第一眼开始看。", "把店名打码也可以发我看看。", "先看一个主要问题就够了。"],
      xiaohongshuDmScripts: ["你可以把页面链接发我，我先看标题和主图。", "先不用发太多资料，我先按客户视角看一遍。", "如果只是想知道问题在哪，可以先做个基础体检。"],
      xiaohongshuPosts: [
        `${base}我觉得很多店不是不会做，而是线上表达有点吃亏。今天只讲一个问题：${pain}。`,
        `刚看了几个页面，发现一个挺常见的点：客户点进去第一眼不知道该看哪里。先把这个问题解决，再谈内容和推广会更踏实。`,
      ],
      xiaohongshuTitles: ["午休看店发现的一个问题", "本地门店线上页面别太吃亏", "客户第一眼看不懂怎么办", "页面不是越满越好", "先把主推项目说清楚", "很多店卡在这一步", "今天只讲一个页面问题", "线上展示也要会表达", "老板不是不专业", "先看页面再谈推广"],
    };
  }

  if (platform === "闲鱼") {
    return {
      xianyuChatReplies: ["可以发我店铺页面，我先看几个明显问题。", "我主要看标题、主图、团单和客户下一步怎么联系。", "不承诺订单，只帮你先看页面问题。", "如果只是想先了解，可以先做一个基础体检。", "你把行业和页面发来，我按本地门店视角看。"],
      xianyuDetails: [
        `适合${target}先看看线上页面哪里有问题。主要看客户第一眼是否看懂主推项目、页面有没有信任感、团单和承接路径是否清楚。`,
        `不做夸张承诺，不说固定效果。就是先按客户视角看一遍页面，找出最影响理解的几个问题，再给修改方向。`,
      ],
      xianyuHooks: ["先看页面问题，再决定要不要改。", "不承诺结果，只做页面体检。", "适合本地门店老板先看问题。", "客户第一眼看不懂就很可惜。", "标题、主图、团单先过一遍。"],
      xianyuTitles: ["本地门店线上页面基础体检", "美团点评店铺页面问题检查", "本地生活门店页面诊断建议", "团购标题主图优化建议", "门店线上展示基础检查", "店铺页面客户视角体检", "本地门店获客页面检查", "点评美团页面修改建议", "线上页面看不懂问题诊断", "门店页面主推项目梳理"],
    };
  }

  if (platform === "微信私聊") {
    return {
      objectionReplies: [
        { answer: "不能承诺订单，这个更像先帮你把线上页面的问题看清楚。", question: "能保证有效果吗？" },
        { answer: "不用一开始就大改，先看客户第一眼能不能看懂。", question: "是不是要改很多？" },
        { answer: "可以，只看页面也行，先不聊合作。", question: "我只是想了解一下可以吗？" },
        { answer: "具体根据门店情况沟通，我不先乱报陪跑价格。", question: "代运营多少钱？" },
        { answer: "先看标题、主图、团单和承接路径，问题通常会比较清楚。", question: "你主要看什么？" },
      ],
      wechatFirstInvites: ["我今天午休看了几个门店页面，发现很多问题都挺像。你要是不介意，可以把页面发我，我先帮你看一眼。", "你家线上页面如果最近咨询少，可以先别急着投流，我先帮你看看页面有没有明显卡点。", "我不一定说得全对，但可以按客户第一眼看到的顺序帮你过一遍页面。", "你把店铺链接发我就行，店名隐私可以打码。", "先看问题，不急着做决定。"],
      wechatFollowUps: ["我再补一句，主要看客户第一眼能不能看懂，不是看页面漂不漂亮。", "你方便的时候发我就行，我按本地门店视角看。", "如果现在忙，晚点发也可以。", "不用准备太多资料，一个线上页面就够。", "我先看一个主要问题，不会一下子给你堆很多东西。"],
      wechatInterestReplies: ["可以，我先看标题、主图、团单和承接路径。", "你发页面过来，我先按客户视角看一遍。", "如果问题比较明显，我会直接告诉你先改哪里。", "先看页面说没说清楚，再谈后面怎么优化。", "如果想认真改，后面再做完整检查和修改方案。"],
    };
  }

  if (platform === "微信群") {
    return {
      wechatGroupActivityPosts: ["群里有本地门店老板想看线上页面的，可以发我，我午休时顺手看几个。", "最近在看本地门店线上页面，有些问题挺共性，想了解的可以发链接。", "不做夸张承诺，就是先看页面哪里没说清楚。", "适合美团、点评、小红书、朋友圈页面都觉得乱的店。", "先看问题，再决定要不要进一步改。"],
      wechatGroupConsultReplies: ["可以，把页面发我，我先看第一眼能不能看懂。", "主要看标题、主图、团单和承接路径。", "店名隐私不方便的话可以打码。", "不保证结果，只帮你找页面问题。", "我先看一个最明显的问题，避免讲太散。"],
      wechatGroupShortPosts: ["今天午休看了几个本地门店页面，很多店线下不差，线上表达有点吃亏。", "门店页面不是内容越多越好，客户第一眼看懂更重要。", "有些团单标题太模糊，客户不知道为什么选你。", "主图如果没有信任感，后面写再多也吃亏。", "先把页面说清楚，再谈推广。"],
    };
  }

  if (platform === "多平台同步") {
    const target = input.targetCustomer || "本地门店老板";
    return {
      douyinScripts: [`今天午休看了一个页面。${target}不是不会做服务，是线上没把重点说清楚。可以先做一次${product}，看看标题、主图和团单哪里卡住。`],
      douyinTitles: ["午休顺手看店，页面有点可惜", "本地门店别先急着投流", "客户第一眼看不懂怎么办", "一个很常见的门店页面问题", "先看问题，再决定怎么改"],
      momentsHumanPosts: ["今天午休又看了几个门店页面。很多问题不是复杂运营，而是客户第一眼没看懂。"],
      momentsSoftPromotionPosts: [`最近可以帮本地门店做一次${product}，先看标题、主图、团单和承接路径。`],
      objectionReplies: [{ question: "能保证有订单吗？", answer: "不能承诺订单，主要是先帮你发现页面和转化路径的问题。" }],
      wechatFirstInvites: ["可以先做一个基础体检，我帮你看 3 个最明显的问题。"],
      xianyuDetails: ["适合想先知道线上店铺哪里有问题的老板。先看问题，再决定要不要优化。"],
      xianyuTitles: ["本地门店线上店铺基础体检", "美团点评页面问题诊断", "小红书朋友圈文案优化建议"],
      xiaohongshuPosts: ["今天看了一个本地门店页面。技术好不好我不知道，但线上展示确实有点吃亏。"],
      xiaohongshuTitles: ["午休看店发现的一个问题", "本地门店线上页面别太吃亏", "客户第一眼看不懂怎么办", "页面不是越满越好", "先把主推项目说清楚"],
    };
  }

  return {
    momentsCommentReplies: ["可以，把页面发我看看，我先看第一眼能不能看懂。", "主要看标题、主图、团单和承接路径。", "你把店名隐私打码也可以。", "先不用急着改，先看问题在哪。", "我不一定说得全对，但会按客户视角看。"],
    momentsHumanPosts: [
      `${base}这个问题不是花多少钱投流能解决的，得先把页面说清楚。`,
      "今天午休又看了几个页面。有些店线下应该做得不差，但线上展示确实有点吃亏。",
      "刚看了一个本地门店页面，第一眼信息太散。客户不是不想了解，是不知道先看哪里。",
      "我发现很多门店页面不是缺内容，而是重点藏得太深。主推项目、适合谁、下一步怎么联系，都要更清楚一点。",
      "午休顺手看页面的时候，经常会看到同一个问题：老板线下做得认真，但线上没有把这份专业表达出来。",
    ],
    momentsImageTextIdeas: ["先把页面说清楚", "客户第一眼要看懂", "不是没技术，是没表达", "先看问题，再谈优化", "主推项目别藏太深", "线上页面也要会说话"],
    momentsProblemObservationPosts: [
      "团购标题太模糊，客户点进去不知道这个套餐到底适合谁。",
      "主图没有信任感，只放环境或项目名，客户很难判断你值不值得选。",
      "评价区如果长期没人维护，客户会默认这家店不太活跃。",
      "套餐排序太乱，客户想快速做决定反而更累。",
      "很多页面最大的问题，是客户看不懂你主推什么。",
    ],
    momentsSoftPromotionPosts: [
      `最近可以帮本地门店先做个${product}，看看线上页面主要卡在哪。`,
      "如果你也想知道自己页面有没有类似问题，可以先发我看一眼。",
      "先不用急着投流，先看看标题、主图、团单和承接路径有没有说清楚。",
    ],
  };
}

function priceText(input: WorkbenchInput, fallback: string): string {
  const mode = input.priceExposure || "根据补充信息决定";
  const extraInfo = input.extraInfo || "";
  if (mode === "显示 4.9 元基础体检") {
    return "4.9 元基础体检";
  }
  if (mode === "显示 69 元全面体检 + 修改方案") {
    return "69 元全面体检 + 修改方案";
  }
  if (mode === "显示 39 元 AI 网站工具月卡") {
    return "39 元 AI 网站工具月卡";
  }
  if (mode === "显示全部价格") {
    return "4.9 元基础体检、69 元全面体检 + 修改方案、39 元 AI 网站工具月卡";
  }
  if (/4\.9|69|39/.test(extraInfo)) {
    return fallback;
  }
  return fallback.replace(/4\.9 元|69 元|39 元|免费|限免|低价/g, "").trim() || "基础体检";
}

function getLayoutAdvice(usageScene: string): string {
  if (usageScene === "小红书封面") {
    return "只做小红书封面，白底黑字，标题大，三条卖点放在中部，底部轻引导";
  }
  if (usageScene === "闲鱼主图") {
    return "只做闲鱼主图，主标题醒目，卖点短，突出先看问题和可交付建议";
  }
  if (usageScene === "抖音封面") {
    return "只做抖音封面，上方大标题，中间手机录屏元素，下方放一句轻引导";
  }
  if (usageScene === "视频号封面") {
    return "只做视频号封面，画面干净，标题不超过两行，保留头像和标题安全区";
  }
  if (usageScene === "多平台通用") {
    return "输出通用排版，标题和卖点居中，适配朋友圈、小红书、闲鱼和短视频封面";
  }
  return "只做朋友圈海报，文字不要太满，标题、三条卖点和底部引导分区清楚";
}
