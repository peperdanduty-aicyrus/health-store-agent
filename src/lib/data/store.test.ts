import { describe, expect, it } from "vitest";
import { createMockStore } from "./store";

describe("mock data store", () => {
  it("logs in the seeded admin account without exposing old sample customer seeds", () => {
    const store = createMockStore();

    expect(store.login("13800000000", "admin123")).toMatchObject({
      role: "admin",
      phone: "13800000000",
    });
    expect(store.listUsers().filter((user) => user.role === "user")).toHaveLength(0);
    expect(store.login("13900000001", "sample123")).toBeNull();
  });

  it("creates users with store profile and membership settings", () => {
    const store = createMockStore();
    const user = store.createUser({
      cityArea: "上海浦东",
      dailyLimit: 30,
      disabled: false,
      expiresAt: "2026-07-10",
      mainProjects: "洁牙、儿童涂氟",
      memberStatus: "paid",
      password: "initial123",
      phone: "13911112222",
      planName: "standard_monthly",
      role: "user",
      storeAdvantages: "社区老客多",
      storeName: "真如口腔",
      storeType: "口腔门诊",
    });

    expect(user.id).toMatch(/^user_/);
    expect(store.listUsers()).toContainEqual(user);
    expect(store.login("13911112222", "initial123")).toMatchObject({
      phone: "13911112222",
      role: "user",
      planName: "standard_monthly",
    });
  });

  it("records formal opening applications and status changes", () => {
    const store = createMockStore();
    const application = store.createOpeningApplication({
      cityArea: "北京朝阳",
      contactName: "王店长",
      interestedFeatures: "小红书文案、私域成交话术",
      note: "准备购买标准月卡",
      phone: "13922223333",
      storeName: "同世堂中医馆",
      storeType: "中医馆 / 中医诊所",
      wechatId: "wang-account",
    });

    expect(application.status).toBe("new");
    expect(store.updateOpeningApplicationStatus(application.id, "contacted")).toMatchObject({
      id: application.id,
      status: "contacted",
    });
  });

  it("records generation results and supports copy and note updates", () => {
    const store = createMockStore();
    const user = store.createUser({
      cityArea: "上海浦东",
      dailyLimit: 30,
      disabled: false,
      expiresAt: "2026-07-10",
      mainProjects: "洁牙、儿童涂氟",
      memberStatus: "paid",
      password: "initial123",
      phone: "13911112222",
      planName: "standard_monthly",
      role: "user",
      storeAdvantages: "社区老客多",
      storeName: "真如口腔",
      storeType: "口腔门诊",
    });

    expect(user).not.toBeNull();

    const generation = store.createGeneration({
      copied: false,
      extraInfo: "周末体验活动",
      generationType: "xiaohongshu",
      modelName: "mock-health-copywriter",
      modelProvider: "mock",
      phone: user.phone,
      planName: user.planName,
      projectName: "三伏贴",
      prompt: "生成小红书文案",
      purpose: "引流咨询",
      result: "三伏贴日常调理内容",
      sensitiveCheckResult: "未发现明显高风险表达",
      storeName: user.storeName,
      storeType: user.storeType,
      targetCustomer: "上班族",
      userId: user.id,
      userNote: "",
    });

    expect(store.listGenerations({ userId: user.id })).toContainEqual(generation);
    expect(store.markGenerationCopied(generation.id)).toMatchObject({ copied: true });
    expect(store.updateGenerationNote(generation.id, "客户想要更口语")).toMatchObject({
      userNote: "客户想要更口语",
    });
  });
});
