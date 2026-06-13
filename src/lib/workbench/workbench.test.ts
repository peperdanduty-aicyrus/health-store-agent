import { describe, expect, it } from "vitest";
import { generateWorkbenchContent } from "../ai/provider";
import { createMockStore } from "../data/store";
import { buildWorkbenchPrompt } from "../prompts/workbench";

const mealboxInput = {
  contentStyle: "真实接地气",
  extraInfo: "门店没有私域承接，团单也不清楚",
  mealDescription: "医院食堂一荤一素",
  publishPlatform: "抖音",
  storeIssue: "页面没有信任感",
  storeType: "中医馆",
  targetPlatform: "美团",
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
  it("builds a JSON-only mealbox prompt with the required output modules", () => {
    const prompt = buildWorkbenchPrompt("mealbox_video", mealboxInput);

    expect(prompt).toContain("小饭盒视频助手");
    expect(prompt).toContain("只输出一个合法 JSON 对象");
    expect(prompt).toContain("不要使用 Markdown 符号");
    expect(prompt).toContain("不要输出 # 标签");
    expect(prompt).toContain("douyinTitles");
    expect(prompt).toContain("pinnedComments");
    expect(prompt).toContain("不要承诺固定订单、固定曝光、保证成交");
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
      douyinTitles: expect.any(Array),
      pinnedComments: expect.any(Array),
      videoScript: expect.stringContaining("开饭咯"),
    });
  });
});
