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
      douyinTitles: [
        "开饭咯，今天顺手看一家本地门店",
        `午休 10 分钟，看懂${storeType}线上漏客点`,
        "老板别急着投流，先看页面问题",
      ],
      hooks: ["开饭咯，看看今天医院食堂吃什么。", "今天饭菜一般，但这个门店页面更值得看看。"],
      videoScript: `开饭咯，看看今天医院食堂吃什么。今天是${input.mealDescription || "打工人小饭盒"}。吃完饭，午休时间顺手看一家${storeType}的线上店铺。先不说投流，单看页面就有一个问题：${issue}。老板可以先把标题、主图、团单和私域承接梳理清楚，客户点进来才知道你适合谁、解决什么问题、下一步怎么咨询。`,
      xiaohongshuPost: `午休看店第 1 条：很多本地门店不是没流量，而是页面没把人留下来。今天这个${storeType}主要问题是${issue}，建议先改标题、主图、团单和承接路径。`,
      momentsPost: "今天午休又看了一个本地门店页面。我的感受是，很多老板先不用急着投流，先把页面里客户看不懂、不信任、不知道怎么咨询的地方改掉。",
      coverTitles: ["午休看店", "本地门店漏客点", "老板先别急投流"],
      pinnedComments: ["想先看自己门店哪里有问题，可以先做一次基础体检。"],
      dmGuides: ["你可以把门店链接发我，我先帮你看 3 个基础问题。"],
    };
  }

  if (type === "promotion_copy") {
    const product = input.product || "4.9 元基础体检";
    const target = input.targetCustomer || "本地门店老板";
    return {
      videoScript: `${target}如果觉得线上没人咨询，可以先不用急着做代运营。先用${product}看一下标题、主图、团单、评价和转化路径哪里卡住，再决定要不要继续优化。`,
      xiaohongshuPost: `很多本地门店不是完全没机会，而是线上页面没有把信任感讲清楚。${product}适合先低门槛看问题，不承诺成交，只帮你把能改的地方找出来。`,
      xianyuTitles: ["本地门店线上店铺基础体检", "美团点评页面问题诊断", "小红书朋友圈文案优化建议"],
      xianyuDetail: "适合想先知道线上店铺哪里有问题的老板。先看问题，再决定要不要优化。",
      momentsPosts: ["今天继续看本地门店页面。很多问题不是复杂运营，而是标题、主图、团单和评价没讲清楚。"],
      privateInviteScripts: ["可以先做一个基础体检，我帮你看 3 个最明显的问题。"],
      objectionReplies: [{ question: "能保证有订单吗？", answer: "不能承诺订单，主要是先帮你发现页面和转化路径的问题。" }],
    };
  }

  if (type === "poster_prompt") {
    const topic = input.mainContent || "4.9 元基础体检";
    return {
      mainTitles: [`${topic}`, "先看问题，再决定要不要改", "本地门店线上体检"],
      subtitles: ["标题、主图、团单、评价、承接路径一起看"],
      sellingPoints: ["低门槛先诊断", "不夸大承诺", "适合真实本地门店"],
      bottomGuides: ["想看自己门店问题，可以私聊发链接"],
      douyinLayout: "上方大标题，中间放手机页面检查场景，下方放引导语。",
      xiaohongshuLayout: "白底黑字加重点色，标题要短，保留大面积文字区。",
      xianyuLayout: "主标题醒目，突出低门槛体检和可交付建议。",
      momentsLayout: "生活化图片底图，文字不要太满，保留信任感。",
      imagePrompts: [`真实本地门店运营诊断海报，主题为${topic}，白底黑字，醒目标题区域，手机页面检查元素，竖版 3:4。`],
    };
  }

  return {
    todayReadyPosts: ["今天午休又看了几个本地门店页面。很多老板不是不会做生意，是线上页面没把客户留下来。"],
    sevenDayPosts: ["第 1 天：先看标题。", "第 2 天：再看主图。", "第 3 天：检查团单。"],
    imageTextIdeas: ["先看问题，再决定要不要改", "不是没客户，是页面没留住客户"],
    commentReplies: ["可以先把链接发我，我帮你看几个基础问题。"],
    closingScripts: ["如果你想认真改，可以先做 69 元全面体检和修改方案。"],
  };
}
