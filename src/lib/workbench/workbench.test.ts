import { describe, expect, it } from "vitest";
import { generateWorkbenchContent } from "../ai/provider";
import { createMockStore } from "../data/store";
import { workbenchFieldDefinitions, workbenchToolDefinitions } from "../domain/workbench";
import { generateWorkbenchPreview } from "./generation";
import { buildWorkbenchPrompt, getWorkbenchOutputStructure, sanitizeWorkbenchOutputForPrice } from "../prompts/workbench";

const mealboxInput = {
  contentStyle: "真实接地气",
  extraInfo: "门店没有私域承接，团单也不清楚",
  mealDescription: "医院食堂一荤一素",
  publishPlatform: "抖音",
  storeIssue: "页面没有信任感",
  storeType: "中医馆",
  targetPlatform: "美团",
};

const posterInput = {
  corePain: "页面乱，客户看不懂",
  designStyle: "真实接地气",
  extraInfo: "",
  mainContent: "基础体检",
  posterCategory: "网站/代运营推广",
  priceExposure: "不显示具体价格",
  targetCustomer: "中医馆老板",
  usageScene: "朋友圈海报",
};

describe("workbench store", () => {
  it("seeds an owner account and lets the owner manage subaccounts", () => {
    const store = createMockStore();

    expect(store.loginWorkbenchAccount("13066622206", "a81366776")).toMatchObject({
      phone: "13066622206",
      role: "owner",
    });

    const subaccount = store.createWorkbenchAccount({
      disabled: false,
      displayName: "短视频助手",
      note: "负责小饭盒内容",
      password: "subpass123",
      phone: "13000000001",
      role: "subaccount",
    });

    expect(store.listWorkbenchAccounts()).toContainEqual(subaccount);
    expect(store.loginWorkbenchAccount("13000000001", "subpass123")).toMatchObject({
      id: subaccount.id,
      role: "subaccount",
    });
  });

  it("blocks disabled workbench subaccounts and supports password resets", () => {
    const store = createMockStore();
    const subaccount = store.createWorkbenchAccount({
      disabled: false,
      displayName: "子账号",
      note: "",
      password: "subpass123",
      phone: "13000000002",
      role: "subaccount",
    });

    expect(store.updateWorkbenchAccountDisabled(subaccount.id, true)).toMatchObject({ disabled: true });
    expect(store.loginWorkbenchAccount("13000000002", "subpass123")).toBeNull();

    expect(store.updateWorkbenchAccountDisabled(subaccount.id, false)).toMatchObject({ disabled: false });
    expect(store.updateWorkbenchAccountPassword(subaccount.id, "newpass456")).toMatchObject({
      updatedAt: expect.any(String),
    });
    expect(store.loginWorkbenchAccount("13000000002", "subpass123")).toBeNull();
    expect(store.loginWorkbenchAccount("13000000002", "newpass456")).toMatchObject({ id: subaccount.id });
  });

  it("keeps subaccount history scoped while owner can view and delete all records", () => {
    const store = createMockStore();
    const owner = store.loginWorkbenchAccount("13066622206", "a81366776");
    const subaccount = store.createWorkbenchAccount({
      disabled: false,
      displayName: "子账号",
      note: "",
      password: "subpass123",
      phone: "13000000003",
      role: "subaccount",
    });

    expect(owner).not.toBeNull();

    const ownerRecord = store.createWorkbenchGeneration({
      accountDisplayName: owner?.displayName ?? "",
      accountId: owner?.id ?? "",
      accountPhone: owner?.phone ?? "",
      copied: false,
      generationType: "promotion_copy",
      input: JSON.stringify({ product: "4.9 元基础体检" }),
      modelName: "mock-workbench-copywriter",
      modelProvider: "mock",
      output: JSON.stringify({ momentsPosts: ["先帮你看问题，再决定要不要优化。"] }),
      prompt: "推广文案",
    });
    const subRecord = store.createWorkbenchGeneration({
      accountDisplayName: subaccount.displayName,
      accountId: subaccount.id,
      accountPhone: subaccount.phone,
      copied: false,
      generationType: "mealbox_video",
      input: JSON.stringify(mealboxInput),
      modelName: "mock-workbench-copywriter",
      modelProvider: "mock",
      output: JSON.stringify({ titles: ["开饭咯，顺手看一家本地门店"] }),
      prompt: "小饭盒视频",
    });

    expect(store.listWorkbenchGenerations({ accountId: subaccount.id })).toEqual([subRecord]);
    expect(store.listWorkbenchGenerations()).toEqual([subRecord, ownerRecord]);
    expect(store.markWorkbenchGenerationCopied(subRecord.id)).toMatchObject({ copied: true });
    expect(store.deleteWorkbenchGeneration(ownerRecord.id)).toBe(true);
    expect(store.listWorkbenchGenerations()).toEqual([expect.objectContaining({ id: subRecord.id })]);
  });
});

describe("workbench prompt and provider", () => {
  it("renames mealbox to the noon store audit video assistant", () => {
    expect(workbenchToolDefinitions.mealbox_video).toMatchObject({
      label: "午休门店体检视频助手",
      description: "生成“医院午休 + 本地门店线上体检”短视频脚本。",
    });
  });

  it("builds a JSON-only noon audit video prompt with shooting modules", () => {
    const prompt = buildWorkbenchPrompt("mealbox_video", mealboxInput);

    expect(prompt).toContain("午休门店体检视频助手");
    expect(prompt).toContain("只输出一个合法 JSON 对象");
    expect(prompt).toContain("不要使用 Markdown 符号");
    expect(prompt).toContain("不要输出 # 标签");
    expect(prompt).toContain("storyboard");
    expect(prompt).toContain("screenRecordingScript");
    expect(prompt).toContain("pinnedComments");
    expect(prompt).toContain("不要一开头就卖服务");
    expect(prompt).toContain("不要承诺固定订单、固定曝光、保证成交");
  });

  it("limits poster output to the selected usage scene and structured image prompts", () => {
    const prompt = buildWorkbenchPrompt("poster_prompt", posterInput);
    const structure = getWorkbenchOutputStructure("poster_prompt");

    expect(prompt).toContain("只输出当前使用场景的排版建议");
    expect(prompt).toContain("朋友圈海报");
    expect(structure).toContain("posterCopySets");
    expect(structure).toContain("layoutAdvice");
    expect(structure).toContain("imagePrompts");
    expect(structure).toContain("visualSubject");
    expect(structure).not.toContain("douyinLayout");
    expect(structure).not.toContain("xiaohongshuLayout");
    expect(structure).not.toContain("xianyuLayout");
    expect(structure).not.toContain("momentsLayout");
  });

  it("adds price exposure fields with useful defaults", () => {
    expect(workbenchFieldDefinitions.promotion_copy).toEqual(
      expect.arrayContaining([expect.objectContaining({ defaultValue: "根据补充信息决定", name: "priceExposure" })]),
    );
    expect(workbenchFieldDefinitions.poster_prompt).toEqual(
      expect.arrayContaining([expect.objectContaining({ defaultValue: "根据补充信息决定", name: "priceExposure" })]),
    );
    expect(workbenchFieldDefinitions.moments_library).toEqual(
      expect.arrayContaining([expect.objectContaining({ defaultValue: "根据补充信息决定", name: "priceExposure" })]),
    );
    expect(workbenchFieldDefinitions.mealbox_video).toEqual(
      expect.arrayContaining([expect.objectContaining({ defaultValue: "不显示具体价格", name: "priceExposure" })]),
    );
  });

  it("keeps prices out of xiaohongshu promotion prompts unless explicitly requested", () => {
    const prompt = buildWorkbenchPrompt("promotion_copy", {
      customerPain: "页面乱",
      extraInfo: "",
      priceExposure: "根据补充信息决定",
      product: "4.9 元基础体检",
      publishPlatform: "小红书",
      targetCustomer: "中医馆老板",
    });

    expect(prompt).toContain("小红书默认不要出现具体价格");
    expect(prompt).toContain("不要在输出中出现 4.9、69、39");
    expect(prompt).toContain("不要一篇文案同时塞 4.9、69、39、代运营、AI工具");
  });

  it("builds promotion output structures only for the selected platform", () => {
    const momentsStructure = getWorkbenchOutputStructure("promotion_copy", { publishPlatform: "朋友圈" });
    const xianyuStructure = getWorkbenchOutputStructure("promotion_copy", { publishPlatform: "闲鱼" });

    expect(momentsStructure).toContain("momentsHumanPosts");
    expect(momentsStructure).toContain("momentsProblemObservationPosts");
    expect(momentsStructure).toContain("momentsCommentReplies");
    expect(momentsStructure).not.toContain("douyinTitles");
    expect(momentsStructure).not.toContain("xiaohongshuTitles");
    expect(momentsStructure).not.toContain("xianyuTitles");
    expect(momentsStructure).not.toContain("privateInviteScripts");
    expect(xianyuStructure).toContain("xianyuTitles");
    expect(xianyuStructure).toContain("xianyuDetails");
    expect(xianyuStructure).not.toContain("momentsHumanPosts");
    expect(xianyuStructure).not.toContain("xiaohongshuTitles");
  });

  it("adds strict platform-only rules to promotion prompts", () => {
    const prompt = buildWorkbenchPrompt("promotion_copy", {
      customerPain: "不知道线上店铺哪里有问题",
      extraInfo: "",
      priceExposure: "根据补充信息决定",
      product: "本地门店线上运营诊断",
      publishPlatform: "朋友圈",
      targetCustomer: "本地生活门店老板",
    });

    expect(prompt).toContain("发布平台：朋友圈");
    expect(prompt).toContain("只能生成发布平台对应的内容");
    expect(prompt).toContain("如果用户选择朋友圈，就禁止输出抖音、小红书、闲鱼、视频号等模块");
    expect(prompt).toContain("朋友圈真人日常版 5 条");
    expect(prompt).not.toContain("小红书种草版");
  });

  it("removes explicit prices and promotional free language when price exposure hides prices", () => {
    const output = sanitizeWorkbenchOutputForPrice(
      '{"text":"免费基础体检，0元诊断你的线上页面问题，只限今天，前 10 名，名额有限，后续可以做 69 元全面体检，也可以试用 39元 AI 工具。比例：9:16。"}',
      { extraInfo: "", priceExposure: "根据补充信息决定", publishPlatform: "朋友圈" },
    );

    expect(output).not.toContain("0元");
    expect(output).not.toContain("69 元");
    expect(output).not.toContain("39元");
    expect(output).not.toContain("免费");
    expect(output).not.toContain("只限今天");
    expect(output).not.toContain("前 10 名");
    expect(output).not.toContain("名额有限");
    expect(output).toContain("比例：9:16");
  });

  it("keeps only the selected single price and removes upsell ladder copy", () => {
    const output = sanitizeWorkbenchOutputForPrice(
      '{"text":"4.9 元基础体检，后续可以做 69 元全面体检，也可以试用 39 元 AI 网站工具月卡，免费名额有限。"}',
      { extraInfo: "", priceExposure: "显示 4.9 元基础体检", publishPlatform: "闲鱼" },
    );

    expect(output).toContain("4.9 元基础体检");
    expect(output).not.toContain("69");
    expect(output).not.toContain("39");
    expect(output).not.toContain("AI 网站工具月卡");
    expect(output).not.toContain("免费");
    expect(output).not.toContain("名额有限");
  });

  it("removes fabricated case and dialogue wording from workbench output", () => {
    const output = sanitizeWorkbenchOutputForPrice(
      '{"text":"今天帮一个朋友看页面，老板说预约量慢慢上来了。刚帮一个客户改完，立马不一样。今天午休看了几个页面，我发现主图没信任感。"}',
      { extraInfo: "", priceExposure: "根据补充信息决定", publishPlatform: "朋友圈" },
    );

    expect(output).not.toMatch(/朋友|老板说|预约量|刚帮一个客户|立马不一样/);
    expect(output).toContain("今天午休看了几个页面");
  });

  it("splits promotion and moments output into human and conversion versions", () => {
    expect(getWorkbenchOutputStructure("promotion_copy", { publishPlatform: "多平台同步" })).toContain("momentsHumanPosts");
    expect(getWorkbenchOutputStructure("promotion_copy", { publishPlatform: "多平台同步" })).toContain("objectionReplies");
    expect(getWorkbenchOutputStructure("promotion_copy", { publishPlatform: "多平台同步" })).toContain("xiaohongshuTitles");
    expect(getWorkbenchOutputStructure("promotion_copy", { publishPlatform: "多平台同步" })).toContain("douyinTitles");
    expect(getWorkbenchOutputStructure("moments_library")).toContain("dailyRecordPosts");
    expect(getWorkbenchOutputStructure("moments_library")).toContain("problemObservationPosts");
    expect(getWorkbenchOutputStructure("moments_library")).toContain("softPromotionPosts");
  });

  it("generates mock workbench content without requiring an API key", async () => {
    const result = await generateWorkbenchContent({
      input: mealboxInput,
      provider: "mock",
      type: "mealbox_video",
    });

    expect(result.provider).toBe("mock");
    expect(result.model).toBe("mock-workbench-copywriter");
    expect(result.prompt).toContain("医院食堂一荤一素");
    expect(JSON.parse(result.content)).toMatchObject({
      storyboard: expect.any(Array),
      screenRecordingScript: expect.any(String),
      pinnedComments: expect.any(Array),
      voiceoverScript: expect.stringContaining("午休"),
    });
  });

  it("generates mock poster content for only the selected scene", async () => {
    const result = await generateWorkbenchContent({
      input: posterInput,
      provider: "mock",
      type: "poster_prompt",
    });
    const parsed = JSON.parse(result.content);

    expect(parsed.posterCopySets[0]).toMatchObject({
      usageScene: "朋友圈海报",
      layoutAdvice: expect.stringContaining("朋友圈"),
    });
    expect(parsed.posterCopySets[0]).not.toHaveProperty("douyinLayout");
    expect(parsed.imagePrompts[0]).toMatchObject({
      caution: expect.stringContaining("不要出现真实商标"),
      visualSubject: expect.any(String),
    });
  });

  it("keeps hidden-price poster copy focused on the current main content", async () => {
    const result = await generateWorkbenchContent({
      input: posterInput,
      provider: "mock",
      type: "poster_prompt",
    });
    const parsed = JSON.parse(result.content);
    const serialized = JSON.stringify(parsed);

    expect(serialized).not.toMatch(/完整检查|修改方案|AI文案工具|AI 网站工具|月卡|69|39/);
    expect(parsed.imagePrompts[0].mainTitle).not.toMatch(/^主标题：/);
  });

  it("generates mock promotion content only for moments and avoids default free or prices", async () => {
    const result = await generateWorkbenchContent({
      input: {
        customerPain: "不知道线上店铺哪里有问题",
        extraInfo: "",
        priceExposure: "根据补充信息决定",
        product: "本地门店线上运营诊断",
        publishPlatform: "朋友圈",
        targetCustomer: "本地生活门店老板",
      },
      provider: "mock",
      type: "promotion_copy",
    });
    const parsed = JSON.parse(result.content);
    const serialized = JSON.stringify(parsed);

    expect(parsed).toMatchObject({
      momentsCommentReplies: expect.any(Array),
      momentsHumanPosts: expect.any(Array),
      momentsImageTextIdeas: expect.any(Array),
      momentsProblemObservationPosts: expect.any(Array),
      momentsSoftPromotionPosts: expect.any(Array),
    });
    expect(parsed.momentsHumanPosts).toHaveLength(5);
    expect(parsed.momentsProblemObservationPosts).toHaveLength(5);
    expect(parsed.momentsSoftPromotionPosts).toHaveLength(3);
    expect(parsed.momentsImageTextIdeas).toHaveLength(6);
    expect(parsed.momentsCommentReplies).toHaveLength(5);
    expect(parsed).not.toHaveProperty("douyinTitles");
    expect(parsed).not.toHaveProperty("xiaohongshuTitles");
    expect(parsed).not.toHaveProperty("xianyuTitles");
    expect(parsed).not.toHaveProperty("privateInviteScripts");
    expect(serialized).not.toMatch(/抖音|视频号|小红书|闲鱼|微信群|微信私聊|客户异议回复|4\.9|69|39|免费|只限今天|前 10 名|名额有限/);
    expect(serialized).not.toMatch(/朋友|老板说|刚帮一个|预约量|立马不一样/);
  });

  it("keeps xianyu 4.9 mock output from upselling other prices", async () => {
    const result = await generateWorkbenchPreview("promotion_copy", {
      customerPain: "团单没人买",
      extraInfo: "强调先看页面问题，不承诺订单",
      priceExposure: "显示 4.9 元基础体检",
      product: "本地门店线上运营诊断",
      publishPlatform: "闲鱼",
      targetCustomer: "本地生活门店老板",
    }, "mock");

    expect(result.result).toContain("4.9 元基础体检");
    expect(result.result).not.toMatch(/69|39|AI月卡|AI 网站工具月卡|免费|名额有限/);
  });

  it("adds no-fabrication and low-platform rules to moments library prompts", () => {
    const prompt = buildWorkbenchPrompt("moments_library", {
      copyStyle: "朋友圈日常分享",
      extraInfo: "不要广告感，围绕午休看店和页面体检",
      priceExposure: "根据补充信息决定",
      publishGoal: "朋友圈长期种草",
      targetCustomer: "本地生活门店老板",
      topic: "本地门店线上运营诊断",
    });

    expect(prompt).toContain("不要编造具体案例");
    expect(prompt).toContain("少提平台");
    expect(prompt).toContain("标题不清楚、主图没信任感、团单看不懂、评价没人维护、页面承接弱");
  });

  it("labels noon video opening shots in Chinese", () => {
    expect(getWorkbenchOutputStructure("mealbox_video")).toContain("openingShotIdeas");
    expect(getWorkbenchOutputStructure("mealbox_video")).not.toContain("openingShots");
  });

  it("generates a public preview result without requiring a workbench account", async () => {
    const result = await generateWorkbenchPreview("promotion_copy", {
      customerPain: "不知道线上店铺哪里有问题",
      extraInfo: "",
      priceExposure: "根据补充信息决定",
      product: "本地门店线上运营诊断",
      publishPlatform: "朋友圈",
      targetCustomer: "本地生活门店老板",
    }, "mock");

    expect(result).toMatchObject({
      inputSummary: expect.objectContaining({
        generationType: "promotion_copy",
        publishPlatform: "朋友圈",
      }),
      model: "mock-workbench-copywriter",
      provider: "mock",
      success: true,
    });
    expect(result.result).toContain("momentsHumanPosts");
    expect(result.result).not.toMatch(/抖音|小红书|闲鱼|4\.9|69|39|免费/);
  });
});
