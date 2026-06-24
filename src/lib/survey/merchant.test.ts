import { describe, expect, it } from "vitest";
import {
  getCurrentSurveyPeriod,
  getSurveyFieldDefinitionsForCategory,
  sanitizeMerchantReasonText,
  validatePeerSalesRows,
} from "./merchant-form";
import { createSeededSurveyMemoryStore } from "./store";
import { createMerchantEditToken, verifyMerchantEditToken } from "./merchant-token";
import { checkSurveyRateLimit, resetSurveyRateLimitForTests } from "./rate-limit";

describe("survey merchant form rules", () => {
  it("auto-selects the previous natural month and marks late submissions after the 8th", () => {
    expect(getCurrentSurveyPeriod(new Date("2026-06-08T12:00:00.000Z"))).toMatchObject({
      isLate: false,
      normalFillEndsAt: "2026-06-08",
      periodMonth: "2026-05",
    });
    expect(getCurrentSurveyPeriod(new Date("2026-06-09T00:00:00.000Z"))).toMatchObject({
      isLate: true,
      normalFillEndsAt: "2026-06-08",
      periodMonth: "2026-05",
    });
  });

  it("validates peer rows or the no-local-peer-store option", () => {
    expect(validatePeerSalesRows([], false)).toEqual("请至少填写一行同城同质门店销售情况，或勾选本地暂无其他同质门店。");
    expect(validatePeerSalesRows([{ mallName: "", salesWan: 10 }], false)).toEqual("同城同质门店的商场名称不能为空。");
    expect(validatePeerSalesRows([{ mallName: "万象城", salesWan: -1 }], false)).toEqual("同城同质门店销售额必须为0或正数。");
    expect(validatePeerSalesRows([], true)).toBeNull();
    expect(validatePeerSalesRows([{ mallName: "万象城", salesWan: 12.3 }], false)).toBeNull();
  });

  it("requires concrete in-store reason text instead of broad external excuses", () => {
    expect(sanitizeMerchantReasonText("大环境不好，商场客流下降")).toBe("请进一步说明本店可以改善的具体问题或动作。");
    expect(sanitizeMerchantReasonText("主推商品陈列弱，员工没有及时介绍新品")).toBeNull();
  });

  it("rate-limits high-frequency public merchant actions by client key", () => {
    resetSurveyRateLimitForTests();

    expect(checkSurveyRateLimit("merchant_search", "client-a", { limit: 2, now: 1000, windowMs: 60_000 })).toBe(true);
    expect(checkSurveyRateLimit("merchant_search", "client-a", { limit: 2, now: 1001, windowMs: 60_000 })).toBe(true);
    expect(checkSurveyRateLimit("merchant_search", "client-a", { limit: 2, now: 1002, windowMs: 60_000 })).toBe(false);
    expect(checkSurveyRateLimit("merchant_search", "client-a", { limit: 2, now: 61_001, windowMs: 60_000 })).toBe(true);
  });

  it("builds category-specific field definitions without duplicating seven pages", () => {
    const kids = getSurveyFieldDefinitionsForCategory("儿童鞋服");
    const edu = getSurveyFieldDefinitionsForCategory("教培");

    expect(kids).toHaveLength(22);
    expect(kids.map((field) => field.key)).toContain("main_series_inventory_ratio");
    expect(kids.map((field) => field.key)).not.toContain("member_recharge_wan");
    expect(edu.map((field) => field.key)).toContain("new_student_count");
    expect(edu.map((field) => field.key)).toContain("member_recharge_wan");
  });

  it("seeds configurable form fields for common and category-specific merchant sections", async () => {
    const store = await createSeededSurveyMemoryStore();
    const seeded = await store.ensureSurveyDemoStores();
    const fields = await store.listEnabledFormFields(seeded.mall.id, seeded.mo.formCategoryCode || seeded.mo.categoryId);

    expect(fields.map((field) => field.fieldKey)).toContain("business_self_rating");
    expect(fields.map((field) => field.fieldKey)).toContain("main_series_inventory_ratio");
    expect(fields.find((field) => field.fieldKey === "improvement_reason_codes")?.optionsJson).toContain("新品带动销售");
  });
});

describe("survey merchant submissions", () => {
  it("prevents duplicate same-store same-month submissions without an edit token", async () => {
    const store = await createSeededSurveyMemoryStore();
    const seeded = await store.ensureSurveyDemoStores();
    const first = await store.createMerchantSubmission({
      categoryName: seeded.mo.categoryName,
      fieldValues: { businessSelfReview: "基本持平", nextMonthTargetWan: 12, salesChangeReasons: ["新品带动销售"] },
      isLate: false,
      mallId: seeded.mall.id,
      memberRechargeWan: 0,
      noLocalPeerStores: true,
      peerRows: [],
      periodMonth: "2026-05",
      salesTargetWan: 10,
      selfReportedSalesWan: 9.8,
      storeId: seeded.mo.id,
    });

    await expect(
      store.createMerchantSubmission({
        categoryName: seeded.mo.categoryName,
        fieldValues: { businessSelfReview: "基本持平" },
        isLate: false,
        mallId: seeded.mall.id,
        memberRechargeWan: 0,
        noLocalPeerStores: true,
        peerRows: [],
        periodMonth: "2026-05",
        salesTargetWan: 10,
        selfReportedSalesWan: 10,
        storeId: seeded.mo.id,
      }),
    ).rejects.toThrow("本店本月数据已提交");

    expect(first.merchantEditTokenHash).toMatch(/^sha256\$/);
  });

  it("allows anonymous edits within 24 hours only with the current browser token and writes change logs", async () => {
    const store = await createSeededSurveyMemoryStore();
    const seeded = await store.ensureSurveyDemoStores();
    const token = await createMerchantEditToken();
    const submission = await store.createMerchantSubmission({
      categoryName: seeded.honor.categoryName,
      editToken: token.token,
      fieldValues: { businessSelfReview: "小幅提升" },
      isLate: false,
      mallId: seeded.mall.id,
      memberRechargeWan: 0,
      noLocalPeerStores: true,
      peerRows: [],
      periodMonth: "2026-05",
      salesTargetWan: 30,
      selfReportedSalesWan: 28,
      storeId: seeded.honor.id,
    });

    await expect(verifyMerchantEditToken(token.token, submission.merchantEditTokenHash)).resolves.toBe(true);
    const originalModifiedAt = submission.lastModifiedAt;
    await expect(
      store.updateMerchantSubmissionWithToken({
        editToken: "wrong-token",
        fieldValues: { businessSelfReview: "明显提升" },
        id: submission.id,
        now: new Date("2026-06-23T01:00:00.000Z"),
        peerRows: [],
        salesTargetWan: 31,
        selfReportedSalesWan: 29,
      }),
    ).rejects.toThrow("当前浏览器没有本次填报的有效修改权限");

    const updated = await store.updateMerchantSubmissionWithToken({
      editToken: token.token,
      fieldValues: { businessSelfReview: "明显提升" },
      id: submission.id,
      now: new Date("2026-06-23T01:00:00.000Z"),
      peerRows: [{ mallName: "万象城", salesWan: 26 }],
      salesTargetWan: 31,
      selfReportedSalesWan: 29,
    });

    expect(updated.lastModifiedAt).not.toBe(originalModifiedAt);
    expect(await store.listSubmissionChangeLogs(submission.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actorType: "merchant", fieldKey: "selfReportedSalesWan" }),
        expect.objectContaining({ actorType: "merchant", fieldKey: "cityPeerStoreSales" }),
      ]),
    );

    await expect(
      store.updateMerchantSubmissionWithToken({
        editToken: token.token,
        fieldValues: {},
        id: submission.id,
        now: new Date(new Date(submission.merchantEditUntil).getTime() + 60 * 1000),
        peerRows: [],
        salesTargetWan: 31,
        selfReportedSalesWan: 29,
      }),
    ).rejects.toThrow("当前浏览器没有本次填报的有效修改权限");
  });

  it("public store search does not leak internal store fields", async () => {
    const store = await createSeededSurveyMemoryStore();
    await store.ensureSurveyDemoStores();
    const results = await store.searchPublicStores("honor");

    expect(results[0]).toMatchObject({
      brandName: "荣耀honor",
      categoryName: "3C数码",
      displayLocation: "B01",
    });
    expect(results[0]).not.toHaveProperty("managerName");
    expect(results[0]).not.toHaveProperty("contactPhone");
    expect(results[0]).not.toHaveProperty("rentMode");
  });
});
