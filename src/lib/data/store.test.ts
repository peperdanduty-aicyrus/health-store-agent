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

  it("links an opened application to the created customer account", () => {
    const store = createMockStore();
    const application = store.createOpeningApplication({
      cityArea: "北京朝阳",
      contactName: "王店长",
      interestedFeatures: "小红书文案、私域成交话术",
      note: "准备开通",
      phone: "13922223333",
      storeName: "同世堂中医馆",
      storeType: "中医馆 / 中医诊所",
      wechatId: "wang-account",
    });
    const user = store.createUser({
      cityArea: application.cityArea,
      dailyLimit: 5,
      disabled: false,
      expiresAt: "2026-06-13",
      mainProjects: application.note,
      memberStatus: "paid",
      password: "initial123",
      phone: application.phone,
      planName: "temporary_opening",
      role: "user",
      storeAdvantages: application.wechatId,
      storeName: application.storeName,
      storeType: application.storeType,
    });

    expect(store.updateOpeningApplicationStatus(application.id, "opened", user.id)).toMatchObject({
      id: application.id,
      openedUserId: user.id,
      status: "opened",
    });
  });

  it("deletes an opening application without deleting the created user", () => {
    const store = createMockStore();
    const application = store.createOpeningApplication({
      cityArea: "北京朝阳",
      contactName: "王店长",
      interestedFeatures: "小红书文案、私域成交话术",
      note: "准备开通",
      phone: "13922223333",
      storeName: "同世堂中医馆",
      storeType: "中医馆 / 中医诊所",
      wechatId: "wang-account",
    });
    const user = store.createUser({
      cityArea: application.cityArea,
      dailyLimit: 5,
      disabled: false,
      expiresAt: "2026-06-13",
      mainProjects: application.note,
      memberStatus: "paid",
      password: "initial123",
      phone: application.phone,
      planName: "temporary_opening",
      role: "user",
      storeAdvantages: application.wechatId,
      storeName: application.storeName,
      storeType: application.storeType,
    });

    expect(store.deleteOpeningApplication(application.id)).toBe(true);
    expect(store.listApplications()).not.toContainEqual(application);
    expect(store.getUserById(user.id)).toMatchObject({ id: user.id, phone: application.phone });
    expect(store.deleteOpeningApplication("missing")).toBe(false);
  });

  it("blocks disabled users from logging in until re-enabled", () => {
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

    expect(store.updateUserDisabled(user.id, true)).toMatchObject({ disabled: true });
    expect(store.login("13911112222", "initial123")).toBeNull();
    expect(store.updateUserDisabled(user.id, false)).toMatchObject({ disabled: false });
    expect(store.login("13911112222", "initial123")).toMatchObject({ id: user.id });
  });

  it("updates user passwords and requires the new password on login", () => {
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

    expect(store.updateUserPassword(user.id, "newpass456")).toMatchObject({ updatedAt: expect.any(String) });
    expect(store.login("13911112222", "initial123")).toBeNull();
    expect(store.login("13911112222", "newpass456")).toMatchObject({ id: user.id });
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
      usedStoreProfile: false,
      userId: user.id,
      userNote: "",
    });

    expect(store.listGenerations({ userId: user.id })).toContainEqual(generation);
    expect(store.markGenerationCopied(generation.id)).toMatchObject({ copied: true });
    expect(store.updateGenerationNote(generation.id, "客户想要更口语")).toMatchObject({
      userNote: "客户想要更口语",
    });
  });

  it("gets a generation record by id for admin detail pages", () => {
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

    const generation = store.createGeneration({
      copied: false,
      extraInfo: "",
      generationType: "moments",
      modelName: "mock-health-copywriter",
      modelProvider: "mock",
      phone: user.phone,
      planName: user.planName,
      projectName: "肩颈调理",
      prompt: "生成朋友圈文案",
      purpose: "引流咨询",
      result: "建议到店评估",
      sensitiveCheckResult: "已自动替换风险表达。",
      storeName: user.storeName,
      storeType: user.storeType,
      targetCustomer: "上班族",
      usedStoreProfile: true,
      userId: user.id,
      userNote: "",
    });

    expect(store.getGenerationById(generation.id)).toMatchObject({
      id: generation.id,
      projectName: "肩颈调理",
      result: "建议到店评估",
      usedStoreProfile: true,
    });
    expect(store.getGenerationById("missing")).toBeNull();
  });

  it("deletes one generation record and can clear all generation records", () => {
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
    const first = store.createGeneration({
      copied: false,
      extraInfo: "",
      generationType: "moments",
      modelName: "mock-health-copywriter",
      modelProvider: "mock",
      phone: user.phone,
      planName: user.planName,
      projectName: "肩颈调理",
      prompt: "生成朋友圈文案",
      purpose: "引流咨询",
      result: "建议到店评估",
      sensitiveCheckResult: "未发现明显高风险表达",
      storeName: user.storeName,
      storeType: user.storeType,
      targetCustomer: "上班族",
      usedStoreProfile: false,
      userId: user.id,
      userNote: "",
    });
    const second = store.createGeneration({
      copied: false,
      extraInfo: "",
      generationType: "douyin_kuaishou",
      modelName: "mock-health-copywriter",
      modelProvider: "mock",
      phone: user.phone,
      planName: user.planName,
      projectName: "洁牙",
      prompt: "生成抖音/快手文案",
      purpose: "提高咨询",
      result: "短视频标题",
      sensitiveCheckResult: "未发现明显高风险表达",
      storeName: user.storeName,
      storeType: user.storeType,
      targetCustomer: "附近居民",
      usedStoreProfile: false,
      userId: user.id,
      userNote: "",
    });

    expect(store.deleteGeneration(first.id)).toBe(true);
    expect(store.getGenerationById(first.id)).toBeNull();
    expect(store.listGenerations({ userId: user.id })).toEqual([second]);
    expect(store.deleteGeneration("missing")).toBe(false);
    expect(store.deleteAllGenerations()).toBe(1);
    expect(store.listGenerations()).toEqual([]);
  });

  it("keeps one editable store profile document per customer", () => {
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

    const first = store.upsertStoreProfile({
      extractedText: "门店介绍文字",
      extractedTextPreview: "门店介绍文字",
      pdfFileName: "",
      pdfFilePath: "",
      profileSummary: "【店铺基础信息】\n* 店铺名称：真如口腔",
      storeName: user.storeName,
      uploadBy: "customer",
      userId: user.id,
    });
    const second = store.upsertStoreProfile({
      extractedText: "新价目表文字",
      extractedTextPreview: "新价目表文字",
      pdfFileName: "",
      pdfFilePath: "",
      profileSummary: "【核心项目】\n* 项目1：洁牙",
      storeName: user.storeName,
      uploadBy: "admin",
      userId: user.id,
    });

    expect(second.id).toBe(first.id);
    expect(store.getStoreProfileByUserId(user.id)).toMatchObject({
      extractedText: "新价目表文字",
      pdfFileName: "",
      profileSummary: "【核心项目】\n* 项目1：洁牙",
      uploadBy: "admin",
    });
    expect(store.listStoreProfiles()).toHaveLength(1);
    expect(store.updateStoreProfileSummary(user.id, "人工补充后的摘要")).toMatchObject({
      profileSummary: "人工补充后的摘要",
    });
    expect(store.deleteStoreProfile(user.id)).toBe(true);
    expect(store.getStoreProfileByUserId(user.id)).toBeNull();
  });
});
