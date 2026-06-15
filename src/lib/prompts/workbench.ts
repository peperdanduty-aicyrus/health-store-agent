import type { WorkbenchGenerationType } from "../data/types";
import { workbenchToolDefinitions } from "../domain/workbench";

export type WorkbenchInput = Record<string, string>;

export function buildWorkbenchPrompt(type: WorkbenchGenerationType, input: WorkbenchInput): string {
  const tool = workbenchToolDefinitions[type];

  return [
    `你是吕明磊私用的${tool.label}。`,
    `功能说明：${tool.description}`,
    getGenerationScopeLine(type, input),
    renderInput(input),
    "基础要求：真实接地气，像本地运营人说的话，不要像硬广告。",
    "合规要求：不要承诺固定订单、固定曝光、保证成交；不要编造具体店铺名；医疗健康相关表达要稳妥。",
    "推广顺序：短视频/朋友圈吸引注意 -> 基础体检 -> 全面体检 + 修改方案 -> AI 网站工具月卡 / 代运营陪跑。是否写具体价格必须听从价格露出方式。",
    getPriceRule(input),
    getHumanWritingRules(),
    getToolSpecificRules(type, input),
    "格式强约束：只输出一个合法 JSON 对象，不要在 JSON 前后添加解释、标题、代码块或多余文字。",
    "排版强约束：不要使用 Markdown 符号，不要输出 # 标签，不要使用 * 或 ---，每个字段内容要方便直接复制。",
    `JSON 结构：${getWorkbenchOutputStructure(type, input)}`,
  ].join("\n");
}

export function sanitizeWorkbenchOutputForPrice(content: string, input: WorkbenchInput): string {
  const priceExposure = input.priceExposure || "根据补充信息决定";
  const publishPlatform = input.publishPlatform || input.usageScene || "";
  const extraInfo = input.extraInfo || "";
  const explicitPriceInExtra = /4\.9|69|39/.test(extraInfo);
  const explicitFreeInExtra = /免费|限免|试用/.test(extraInfo);
  const shouldHideAmounts =
    priceExposure === "不显示具体价格" ||
    priceExposure === "只写基础体检/先看一下" ||
    priceExposure === "只写免费体验/基础体检" ||
    (publishPlatform.includes("小红书") && priceExposure === "根据补充信息决定") ||
    (priceExposure === "根据补充信息决定" && !explicitPriceInExtra);
  const shouldHideFree =
    priceExposure === "不显示具体价格" ||
    priceExposure === "只写基础体检/先看一下" ||
    priceExposure === "根据补充信息决定" ||
    (publishPlatform.includes("小红书") && !explicitFreeInExtra);

  let result = content;
  if (shouldHideAmounts) {
    result = result
      .replace(/\d+(?:\.\d+)?\s*元/g, "")
      .replace(/4\.9/g, "")
      .replace(/69/g, "")
      .replace(/39/g, "");
  }
  if (shouldHideFree && !explicitFreeInExtra) {
    result = result
      .replace(/免费/g, "")
      .replace(/限免/g, "")
      .replace(/低价/g, "")
      .replace(/只限今天/g, "")
      .replace(/前\s*10\s*名/g, "")
      .replace(/名额有限/g, "")
      .replace(/不收费，不推销/g, "")
      .replace(/不收费/g, "");
  }

  return result
    .replace(/基础体检——诊断/g, "基础体检——先诊断")
    .replace(/基础体检——你的/g, "基础体检——看看你的");
}

export function getWorkbenchOutputStructure(type: WorkbenchGenerationType, input: WorkbenchInput = {}): string {
  const structures: Record<WorkbenchGenerationType, string> = {
    mealbox_video:
      '{"videoTitles":["视频标题1","视频标题2","视频标题3","视频标题4","视频标题5","视频标题6","视频标题7","视频标题8","视频标题9","视频标题10"],"openingShots":["开头3秒画面建议1","开头3秒画面建议2","开头3秒画面建议3","开头3秒画面建议4","开头3秒画面建议5"],"storyboard":[{"shot":"镜头1","duration":"2-3秒","visual":"画面","voiceover":"口播/字幕"},{"shot":"镜头2","duration":"2-3秒","visual":"画面","voiceover":"口播/字幕"},{"shot":"镜头3","duration":"8-15秒","visual":"画面","voiceover":"口播/字幕"},{"shot":"镜头4","duration":"8-15秒","visual":"画面","voiceover":"口播/字幕"},{"shot":"镜头5","duration":"8-15秒","visual":"画面","voiceover":"口播/字幕"},{"shot":"镜头6","duration":"3-5秒","visual":"画面","voiceover":"口播/字幕"}],"voiceoverScript":"口播稿","screenRecordingScript":"手机录屏时的讲解话术","endingGuides":["结尾引导话术1","结尾引导话术2","结尾引导话术3","结尾引导话术4","结尾引导话术5"],"pinnedComments":["评论区置顶话术1","评论区置顶话术2","评论区置顶话术3"],"momentsPosts":["朋友圈同步文案1","朋友圈同步文案2","朋友圈同步文案3"],"xiaohongshuPost":"小红书同步文案"}',
    promotion_copy: getPromotionOutputStructure(input.publishPlatform || "朋友圈"),
    poster_prompt:
      '{"posterCopySets":[{"mainTitle":"大标题：xxxx","subtitle":"副标题：xxxx","sellingPoint1":"卖点1：xxxx","sellingPoint2":"卖点2：xxxx","sellingPoint3":"卖点3：xxxx","bottomGuide":"底部引导语：xxxx","usageScene":"使用场景","layoutAdvice":"排版建议：xxxx","imagePrompt":"AI作图提示词：xxxx"}],"imagePrompts":[{"name":"AI作图提示词1","visualSubject":"画面主体：xxxx","background":"背景环境：xxxx","textArea":"文字区域：xxxx","mainTitle":"主标题：xxxx","subtitle":"副标题：xxxx","style":"风格：xxxx","colors":"颜色：xxxx","ratio":"比例：xxxx","caution":"注意事项：不要出现真实商标，不要出现夸张医疗承诺，不要出现具体店名。"},{"name":"AI作图提示词2","visualSubject":"画面主体：xxxx","background":"背景环境：xxxx","textArea":"文字区域：xxxx","mainTitle":"主标题：xxxx","subtitle":"副标题：xxxx","style":"风格：xxxx","colors":"颜色：xxxx","ratio":"比例：xxxx","caution":"注意事项：不要出现真实商标，不要出现夸张医疗承诺，不要出现具体店名。"}]}',
    moments_library:
      '{"dailyRecordPosts":["日常记录型1","日常记录型2","日常记录型3","日常记录型4","日常记录型5"],"problemObservationPosts":["问题观察型1","问题观察型2","问题观察型3","问题观察型4","问题观察型5"],"softPromotionPosts":["轻度宣传型1","轻度宣传型2","轻度宣传型3","轻度宣传型4","轻度宣传型5"],"privateChatPosts":["私聊承接型1","私聊承接型2","私聊承接型3","私聊承接型4","私聊承接型5"],"conversionPosts":["成交转化型1","成交转化型2","成交转化型3"],"imageTextIdeas":["朋友圈配图短句1","朋友圈配图短句2","朋友圈配图短句3","朋友圈配图短句4","朋友圈配图短句5","朋友圈配图短句6","朋友圈配图短句7","朋友圈配图短句8","朋友圈配图短句9","朋友圈配图短句10"]}',
  };

  return structures[type];
}

function getGenerationScopeLine(type: WorkbenchGenerationType, input: WorkbenchInput): string {
  if (type === "promotion_copy") {
    const platform = input.publishPlatform || "朋友圈";
    return `请根据下面表单信息生成可直接复制的中文内容。发布平台：${platform}。只能生成发布平台对应的内容，禁止输出其他平台内容。`;
  }
  return "请根据下面表单信息生成可直接复制到抖音、视频号、小红书、闲鱼、朋友圈和微信的中文内容。";
}

function getPromotionOutputStructure(platform: string): string {
  if (platform === "抖音") {
    return '{"douyinTitles":["抖音标题1","抖音标题2","抖音标题3","抖音标题4","抖音标题5","抖音标题6","抖音标题7","抖音标题8","抖音标题9","抖音标题10"],"douyinHooks":["抖音开头3秒钩子1","抖音开头3秒钩子2","抖音开头3秒钩子3","抖音开头3秒钩子4","抖音开头3秒钩子5"],"douyinScripts":["抖音口播稿1","抖音口播稿2"],"douyinPinnedComments":["抖音评论区置顶话术1","抖音评论区置顶话术2","抖音评论区置顶话术3"],"douyinDmScripts":["抖音私信承接话术1","抖音私信承接话术2","抖音私信承接话术3"]}';
  }
  if (platform === "视频号") {
    return '{"videoChannelTitles":["视频号标题1","视频号标题2","视频号标题3","视频号标题4","视频号标题5","视频号标题6","视频号标题7","视频号标题8","视频号标题9","视频号标题10"],"videoChannelScripts":["视频号口播稿1","视频号口播稿2"],"videoChannelMomentsPosts":["视频号朋友圈同步文案1","视频号朋友圈同步文案2","视频号朋友圈同步文案3"],"videoChannelCommentReplies":["视频号评论区承接话术1","视频号评论区承接话术2","视频号评论区承接话术3"]}';
  }
  if (platform === "小红书") {
    return '{"xiaohongshuTitles":["小红书标题1","小红书标题2","小红书标题3","小红书标题4","小红书标题5","小红书标题6","小红书标题7","小红书标题8","小红书标题9","小红书标题10"],"xiaohongshuPosts":["小红书正文1","小红书正文2"],"xiaohongshuCommentGuides":["小红书评论区引导1","小红书评论区引导2","小红书评论区引导3"],"xiaohongshuDmScripts":["小红书私信承接话术1","小红书私信承接话术2","小红书私信承接话术3"]}';
  }
  if (platform === "闲鱼") {
    return '{"xianyuTitles":["闲鱼标题1","闲鱼标题2","闲鱼标题3","闲鱼标题4","闲鱼标题5","闲鱼标题6","闲鱼标题7","闲鱼标题8","闲鱼标题9","闲鱼标题10"],"xianyuDetails":["闲鱼详情文案1","闲鱼详情文案2"],"xianyuHooks":["闲鱼首句钩子1","闲鱼首句钩子2","闲鱼首句钩子3","闲鱼首句钩子4","闲鱼首句钩子5"],"xianyuChatReplies":["闲鱼私聊回复话术1","闲鱼私聊回复话术2","闲鱼私聊回复话术3","闲鱼私聊回复话术4","闲鱼私聊回复话术5"]}';
  }
  if (platform === "微信私聊") {
    return '{"wechatFirstInvites":["首次私聊邀约话术1","首次私聊邀约话术2","首次私聊邀约话术3","首次私聊邀约话术4","首次私聊邀约话术5"],"wechatInterestReplies":["客户感兴趣后的承接话术1","客户感兴趣后的承接话术2","客户感兴趣后的承接话术3","客户感兴趣后的承接话术4","客户感兴趣后的承接话术5"],"wechatFollowUps":["客户没回复的追问话术1","客户没回复的追问话术2","客户没回复的追问话术3","客户没回复的追问话术4","客户没回复的追问话术5"],"objectionReplies":[{"question":"客户异议1","answer":"回复1"},{"question":"客户异议2","answer":"回复2"},{"question":"客户异议3","answer":"回复3"},{"question":"客户异议4","answer":"回复4"},{"question":"客户异议5","answer":"回复5"}]}';
  }
  if (platform === "微信群") {
    return '{"wechatGroupShortPosts":["微信群短文案1","微信群短文案2","微信群短文案3","微信群短文案4","微信群短文案5"],"wechatGroupActivityPosts":["微信群活动引导文案1","微信群活动引导文案2","微信群活动引导文案3","微信群活动引导文案4","微信群活动引导文案5"],"wechatGroupConsultReplies":["群内有人咨询后的回复1","群内有人咨询后的回复2","群内有人咨询后的回复3","群内有人咨询后的回复4","群内有人咨询后的回复5"]}';
  }
  if (platform === "多平台同步") {
    return '{"douyinTitles":["抖音/视频号标题1","抖音/视频号标题2","抖音/视频号标题3","抖音/视频号标题4","抖音/视频号标题5"],"douyinScripts":["抖音/视频号口播稿1","抖音/视频号口播稿2"],"xiaohongshuTitles":["小红书标题1","小红书标题2","小红书标题3","小红书标题4","小红书标题5"],"xiaohongshuPosts":["小红书正文1","小红书正文2"],"xianyuTitles":["闲鱼标题1","闲鱼标题2","闲鱼标题3","闲鱼标题4","闲鱼标题5"],"xianyuDetails":["闲鱼详情文案1","闲鱼详情文案2"],"momentsHumanPosts":["朋友圈真人日常版1","朋友圈真人日常版2","朋友圈真人日常版3"],"momentsSoftPromotionPosts":["朋友圈轻度宣传版1","朋友圈轻度宣传版2","朋友圈轻度宣传版3"],"wechatFirstInvites":["微信私聊邀约话术1","微信私聊邀约话术2","微信私聊邀约话术3"],"objectionReplies":[{"question":"客户异议1","answer":"回复1"},{"question":"客户异议2","answer":"回复2"},{"question":"客户异议3","answer":"回复3"}]}';
  }
  return '{"momentsHumanPosts":["朋友圈真人日常版1","朋友圈真人日常版2","朋友圈真人日常版3","朋友圈真人日常版4","朋友圈真人日常版5"],"momentsProblemObservationPosts":["朋友圈问题观察版1","朋友圈问题观察版2","朋友圈问题观察版3","朋友圈问题观察版4","朋友圈问题观察版5"],"momentsSoftPromotionPosts":["朋友圈轻度宣传版1","朋友圈轻度宣传版2","朋友圈轻度宣传版3"],"momentsImageTextIdeas":["朋友圈配图短句1","朋友圈配图短句2","朋友圈配图短句3","朋友圈配图短句4","朋友圈配图短句5","朋友圈配图短句6"],"momentsCommentReplies":["朋友圈评论/私聊承接话术1","朋友圈评论/私聊承接话术2","朋友圈评论/私聊承接话术3","朋友圈评论/私聊承接话术4","朋友圈评论/私聊承接话术5"]}';
}

function getPriceRule(input: WorkbenchInput): string {
  const priceExposure = input.priceExposure || "根据补充信息决定";
  const publishPlatform = input.publishPlatform || input.usageScene || "";
  const extraInfo = input.extraInfo || "";
  const explicitPriceInExtra = /4\.9|69|39/.test(extraInfo);
  const explicitFreeInExtra = /免费|限免|试用/.test(extraInfo);
  const xiaohongshuDefault = publishPlatform.includes("小红书") && priceExposure === "根据补充信息决定";

  const shared = [
    `价格露出方式：${priceExposure}。`,
    "根据补充信息决定时，只根据补充信息里的文字决定。补充信息没写价格，就不出现价格；补充信息没写免费，就不出现免费。",
    "如果用户没有明确选择显示价格，也没有在补充信息里写 4.9、69、39，就不要自动出现具体价格。",
    "如果用户没有在补充信息里写“免费”，也没有明确选择免费试用/免费体检，就不要自动写免费、限免、只限今天、前 10 名、名额有限。",
    "小红书默认不要出现具体价格或免费，除非价格露出方式或补充信息明确要求。",
    "代运营陪跑价格不要自动编造，统一写“具体根据门店情况沟通”。",
  ];

  if (priceExposure === "不显示具体价格" || xiaohongshuDefault || (priceExposure === "根据补充信息决定" && !explicitPriceInExtra)) {
    shared.push("不要在输出中出现 4.9、69、39。把 4.9 元基础体检写成基础体检，把 69 元全面体检 + 修改方案写成完整检查和修改方案，把 39 元 AI 网站工具月卡写成 AI 文案工具。");
  } else if (priceExposure === "只写基础体检/先看一下" || priceExposure === "只写免费体验/基础体检") {
    shared.push("可以写基础体检、先帮你看一眼、先看看问题在哪、先做个简单检查，但不要写具体金额，不要写免费，不要在输出中出现 4.9、69、39。");
  } else if (priceExposure === "显示 4.9 元基础体检") {
    shared.push("只允许出现 4.9 元基础体检，不要顺带写 69 和 39。");
  } else if (priceExposure === "显示 69 元全面体检 + 修改方案") {
    shared.push("只允许出现 69 元全面体检 + 修改方案，不要顺带写 4.9 和 39。");
  } else if (priceExposure === "显示 39 元 AI 网站工具月卡") {
    shared.push("只允许出现 39 元 AI 网站工具月卡，不要顺带写 4.9 和 69。");
  } else if (priceExposure !== "显示全部价格") {
    shared.push("只露出用户选择的那一个价格，不要顺手把 4.9、69、39 全部塞进同一篇。");
  } else {
    shared.push("用户选择显示全部价格时，才可以完整输出 4.9、69、39 的转化路径。");
  }
  if ((priceExposure === "根据补充信息决定" && !explicitFreeInExtra) || priceExposure === "不显示具体价格") {
    shared.push("不要写免费、限免、低价、只限今天、前 10 名、名额有限。默认写“可以先做一个基础体检”“可以先帮你看一眼”“先看看问题在哪”。");
  }

  return shared.join("\n");
}

function getHumanWritingRules(): string {
  return [
    "反 AI 文案规则：不要总用“老板看过来”开头；不要总用“是不是也这样”；不要说“客户自然就来了”；不要写“从没人到排队”；不要写“保证真实自然”“保证有效”“没效果不收费”；不要写曝光或成交数据承诺；不要太多感叹号；不要像培训老师讲课；不要像广告公司招商；不要每篇堆满美团、点评、小红书、抖音、闲鱼；不要一篇文案同时塞 4.9、69、39、代运营、AI工具，除非用户明确选择“显示全部价格”；不要编造案例结果、客户反馈或医疗疗效；不要出现“让客户主动上门”“客户自然来”“排队”等过度结果导向词。",
    "真人感文案规则：先写场景，再写观点；先说今天看到什么，再说发现什么问题；每篇只讲一个具体问题；多用短句；可以使用“我今天看了一个页面”“这个地方我觉得挺可惜”“老板不一定是不专业，是线上没表达出来”；可以有一点犀利但不要骂人；可以有打工人午休感；可以有“我不一定说得全对，但这个问题很多店都有”的口吻；结尾轻引导私聊，不要强卖。",
  ].join("\n");
}

function getToolSpecificRules(type: WorkbenchGenerationType, input: WorkbenchInput): string {
  if (type === "mealbox_video") {
    return [
      "午休门店体检视频助手规则：视频形式是先拍医院食堂、医院环境、饭菜或打工人午休状态，再拍拿起手机，再切手机录屏看一家本地门店线上页面。",
      "店铺名称和隐私信息必须提醒打码；用户已经提前判断好问题，你只根据输入问题写适合拍摄的脚本。",
      "不要像培训课，不要一开头就卖服务，不要一上来就说“大家好，我是专业做运营的”。先有生活场景，再转到门店问题。每条视频只讲 1 个主要问题。话术要短，适合抖音和视频号，适合手机录屏讲解。",
    ].join("\n");
  }

  if (type === "poster_prompt") {
    const usageScene = input.usageScene || "朋友圈海报";
    return [
      `海报助手规则：用户选择的使用场景是${usageScene}。只输出当前使用场景的排版建议，除非使用场景是“多平台通用”。`,
      "如果选择朋友圈海报，只输出朋友圈海报排版建议；如果选择小红书封面，只输出小红书封面排版建议；如果选择闲鱼主图，只输出闲鱼主图排版建议；如果选择抖音封面，只输出抖音封面排版建议；如果选择视频号封面，只输出视频号封面排版建议。",
      "海报文案字段必须带前缀：大标题：、副标题：、卖点1：、卖点2：、卖点3：、底部引导语：、排版建议：、AI作图提示词：。",
      "AI 作图提示词必须按字段输出：画面主体、背景环境、文字区域、主标题、副标题、风格、颜色、比例、注意事项。",
    ].join("\n");
  }

  if (type === "promotion_copy") {
    const platform = input.publishPlatform || "朋友圈";
    return [
      `推广文案助手规则：用户选择的发布平台是${platform}。只能生成发布平台对应的内容，禁止输出其他平台内容。如果用户选择朋友圈，就禁止输出抖音、小红书、闲鱼、视频号等模块。`,
      getPromotionPlatformRule(platform),
      "朋友圈文案禁止出现：老板注意啦、抓紧私信、只限今天、前 10 名、客户自然就来了、客流量明显提升、转化率提升不少、专业运营帮你免费看店、不收费，不推销、立马安排、几分钟就搞定、效果更好、从冷清到排队、客户主动上门。",
      "朋友圈文案不要编造具体案例、客户反馈或对话。除非补充信息明确提供，不要写“刚帮一个客户”“朋友的店”“老板说”“姐妹的店”“立马不一样”等具体故事。",
    ].join("\n");
  }

  return "朋友圈长期宣传文案库规则：不要只写广告，必须分为日常记录型、问题观察型、轻度宣传型、私聊承接型、成交转化型五类。";
}

function getPromotionPlatformRule(platform: string): string {
  if (platform === "抖音") {
    return "如果发布平台是抖音，只输出：抖音标题 10 条、抖音开头 3 秒钩子 5 条、抖音口播稿 2 条、抖音评论区置顶话术 3 条、抖音私信承接话术 3 条。不要输出朋友圈、小红书、闲鱼、视频号等其他平台内容。";
  }
  if (platform === "视频号") {
    return "如果发布平台是视频号，只输出：视频号标题 10 条、视频号口播稿 2 条、视频号朋友圈同步文案 3 条、视频号评论区承接话术 3 条。不要输出抖音、小红书、闲鱼等其他平台内容。";
  }
  if (platform === "小红书") {
    return "如果发布平台是小红书，只输出：小红书标题 10 条、小红书正文 2 篇、小红书评论区引导 3 条、小红书私信承接话术 3 条。不要输出抖音、视频号、朋友圈、闲鱼等其他平台内容。";
  }
  if (platform === "闲鱼") {
    return "如果发布平台是闲鱼，只输出：闲鱼标题 10 条、闲鱼详情文案 2 篇、闲鱼首句钩子 5 条、闲鱼私聊回复话术 5 条。不要输出抖音、视频号、小红书、朋友圈等其他平台内容。";
  }
  if (platform === "微信私聊") {
    return "如果发布平台是微信私聊，只输出：首次私聊邀约话术 5 条、客户感兴趣后的承接话术 5 条、客户没回复的追问话术 5 条、客户异议回复 5 条。不要输出朋友圈、抖音、小红书、闲鱼等内容。";
  }
  if (platform === "微信群") {
    return "如果发布平台是微信群，只输出：微信群短文案 5 条、微信群活动引导文案 5 条、群内有人咨询后的回复 5 条。";
  }
  if (platform === "多平台同步") {
    return "只有发布平台是多平台同步时，才可以同时输出抖音/视频号、小红书、闲鱼、朋友圈、微信私聊和客户异议回复。";
  }
  return "如果发布平台是朋友圈，只输出：朋友圈真人日常版 5 条、朋友圈问题观察版 5 条、朋友圈轻度宣传版 3 条、朋友圈配图短句 6 条、朋友圈评论/私聊承接话术 5 条。不要输出抖音/视频号内容、小红书内容、闲鱼标题、闲鱼详情、微信群文案、微信私聊邀约、客户异议回复。";
}

function renderInput(input: WorkbenchInput): string {
  const lines = Object.entries(input)
    .filter(([, value]) => String(value || "").trim())
    .map(([key, value]) => `${inputLabelFor(key)}：${value}`);

  return lines.length ? ["表单信息：", ...lines].join("\n") : "表单信息：无";
}

function inputLabelFor(key: string): string {
  const labels: Record<string, string> = {
    contentStyle: "内容风格",
    corePain: "核心痛点",
    customerPain: "客户痛点",
    designStyle: "设计风格",
    extraInfo: "补充信息",
    mainContent: "主推内容",
    mealDescription: "今日饭菜描述",
    posterCategory: "海报类别",
    priceExposure: "价格露出方式",
    product: "推广产品",
    publishGoal: "发布目的",
    publishPlatform: "发布平台",
    storeIssue: "店铺主要问题",
    storeType: "店铺行业",
    targetCustomer: "目标客户",
    targetPlatform: "检查平台",
    topic: "宣传主题",
    usageScene: "使用场景",
  };

  return labels[key] ?? key;
}
