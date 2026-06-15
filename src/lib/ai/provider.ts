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
    const product = priceText(input, input.product || "基础体检");
    const target = input.targetCustomer || "本地门店老板";
    return {
      shortVideoLifeScript: `今天午休看了一个页面。${target}不是不会做服务，是线上没把重点说清楚。可以先做一次${product}，看看标题、主图和团单哪里卡住。`,
      shortVideoProblemScript: "这个页面最可惜的地方，是客户第一眼不知道主推什么。先把一个问题讲清楚，比把所有平台都堆上去更有用。",
      xiaohongshuSoftPost: "今天看了一个本地门店页面。技术好不好我不知道，但线上展示确实有点吃亏。客户点进去第一眼不知道你主推什么，这个地方挺可惜。",
      xiaohongshuConsultPost: `如果你也想知道自己页面有没有类似问题，可以先让我帮你看一眼。先看问题，再决定要不要做${product}。`,
      xianyuTitles: ["本地门店线上店铺基础体检", "美团点评页面问题诊断", "小红书朋友圈文案优化建议"],
      xianyuDetail: "适合想先知道线上店铺哪里有问题的老板。先看问题，再决定要不要优化。",
      momentsHumanPosts: ["今天午休又看了几个门店页面。很多问题不是复杂运营，而是客户第一眼没看懂。"],
      momentsConversionPosts: [`最近可以帮本地门店做一次${product}，先看标题、主图、团单和承接路径。`],
      privateInviteScripts: ["可以先做一个基础体检，我帮你看 3 个最明显的问题。"],
      objectionReplies: [{ question: "能保证有订单吗？", answer: "不能承诺订单，主要是先帮你发现页面和转化路径的问题。" }],
    };
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

function priceText(input: WorkbenchInput, fallback: string): string {
  const mode = input.priceExposure || "根据补充信息决定";
  if (mode === "不显示具体价格" || mode === "只写免费体验/基础体检") {
    return fallback.replace(/4\.9 元|69 元|39 元/g, "").trim() || "基础体检";
  }
  return fallback;
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
