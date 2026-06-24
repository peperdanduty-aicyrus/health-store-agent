import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateFollowUpBuckets, evaluateStoreWarnings, getStaffEfficiencyWarningStatus } from "./analytics";
import { surveyFieldDictionary } from "./field-dictionary";
import { createLocalSurveyD1Database } from "./local-d1";
import { createSeededSurveyMemoryStore } from "./store";
import { createSurveyD1Store } from "./store-d1";
import type { SurveyMonthlyMetric } from "./types";

describe("phase 4 D1-backed operation contracts", () => {
  it("loads all 73 dictionary fields into the real merchant form source", () => {
    expect(surveyFieldDictionary).toHaveLength(73);
    expect(surveyFieldDictionary.filter((field) => field.categoryCode === "COMMON")).toHaveLength(13);
    expect(surveyFieldDictionary.map((field) => field.fieldKey)).toEqual(expect.arrayContaining(["self_reported_sales_wan", "sales_target_wan", "business_self_rating", "member_recharge_wan"]));
  });

  it("persists POS upserts, recalculates metrics, and writes audit logs", async () => {
    const store = await createSeededSurveyMemoryStore();
    const seeded = await store.ensureSurveyDemoStores();

    const first = await store.upsertPosSale({
      actorId: "operator-1",
      mallId: seeded.mall.id,
      periodMonth: "2026-05",
      remark: "首录",
      salesWan: 12.3,
      storeId: seeded.honor.id,
      targetSalesWan: 10,
    });
    const second = await store.upsertPosSale({
      actorId: "operator-1",
      mallId: seeded.mall.id,
      periodMonth: "2026-05",
      remark: "更新",
      salesWan: 13.4,
      storeId: seeded.honor.id,
      targetSalesWan: 10,
    });

    expect(second.id).toBe(first.id);
    expect(await store.listPosSales("2026-05", seeded.mall.id)).toHaveLength(1);
    expect((await store.listMonthlyMetrics("2026-05", seeded.mall.id)).find((metric) => metric.storeId === seeded.honor.id)).toMatchObject({
      effectiveSalesWan: 13.4,
      salesSource: "pos",
      targetCompletionRate: 1.34,
    });
    expect((await store.listAuditLogs()).map((log) => log.action)).toEqual(expect.arrayContaining(["pos.create", "pos.update"]));
  });

  it("persists month open, close, and reopened history for merchant-side period resolution", async () => {
    const store = await createSeededSurveyMemoryStore();
    const seeded = await store.ensureSurveyDemoStores();

    await store.openSurveyPeriod({
      actorId: "operator-1",
      mallId: seeded.mall.id,
      normalFillEndsAt: "2026-06-08",
      periodMonth: "2026-05",
    });
    await store.closeSurveyPeriod({ actorId: "operator-1", mallId: seeded.mall.id, periodMonth: "2026-05" });
    await store.reopenSurveyPeriod({
      actorId: "operator-2",
      mallId: seeded.mall.id,
      periodMonth: "2026-05",
      reopenedUntil: "2026-06-30",
    });

    expect(await store.resolveMerchantFillPeriods(seeded.mall.id, new Date("2026-06-23T00:00:00.000Z"))).toEqual(
      expect.arrayContaining([expect.objectContaining({ periodMonth: "2026-05", reopenedBy: "operator-2", status: "reopened" })]),
    );
    expect((await store.listAuditLogs()).map((log) => log.action)).toEqual(expect.arrayContaining(["period.open", "period.close", "period.reopen"]));
  });

  it("persists follow-up create and edit records and feeds reminder buckets", async () => {
    const store = await createSeededSurveyMemoryStore();
    const seeded = await store.ensureSurveyDemoStores();
    const followUp = await store.createFollowUp({
      actorId: "operator-1",
      followUpDate: "2026-06-23",
      followUpItem: "核对销售下降原因",
      followUpMethod: "微信",
      mallId: seeded.mall.id,
      merchantFeedback: "已沟通",
      nextAction: "下周复查",
      nextFollowUpDate: "2026-06-23",
      ownerName: "营运A",
      periodMonth: "2026-05",
      status: "待复查",
      storeId: seeded.honor.id,
      warningId: "W01",
    });
    await store.updateFollowUp({ ...followUp, actorId: "operator-1", followUpItem: "复查陈列调整", status: "已完成" });

    const rows = await store.listFollowUps("2026-05", seeded.mall.id);
    expect(rows[0]).toMatchObject({ followUpItem: "复查陈列调整", status: "已完成", warningId: "W01" });
    expect(evaluateFollowUpBuckets(rows, new Date("2026-06-23T00:00:00.000Z"))).toMatchObject({ overdue: 0, review: 0, today: 0 });
  });

  it("keeps W09 disabled and leaves W10 pending until staff snapshots are sufficient", () => {
    const current = metric("2026-05", 10, 5);
    const warnings = evaluateStoreWarnings({ current, peerRows: [{ mallName: "万象城", salesWan: 9 }], previousMetrics: [metric("2026-04", 12, null)] });

    expect(warnings.map((warning) => warning.code)).not.toContain("W09");
    expect(warnings.map((warning) => warning.code)).not.toContain("W10");
    expect(getStaffEfficiencyWarningStatus({ current, previousMetrics: [metric("2026-04", 12, null)] })).toBe("待数据积累");
  });

  it("writes POS, periods, and follow-ups through the local sqlite D1 adapter", async () => {
    const dbPath = join(mkdtempSync(join(tmpdir(), "survey-d1-")), "survey.sqlite");
    writeFileSync(dbPath, "");
    const db = createLocalSurveyD1Database(dbPath);
    expect(db).not.toBeNull();
    const store = await createSurveyD1Store(db!);
    const seeded = await store.ensureSurveyDemoStores();

    await store.upsertPosSale({
      actorId: "operator-sqlite",
      mallId: seeded.mall.id,
      periodMonth: "2026-05",
      remark: "sqlite验证",
      salesWan: 22.2,
      storeId: seeded.honor.id,
      targetSalesWan: 20,
    });
    await store.reopenSurveyPeriod({
      actorId: "operator-sqlite",
      mallId: seeded.mall.id,
      periodMonth: "2026-05",
      reopenedUntil: "2026-06-30",
    });
    await store.createFollowUp({
      actorId: "operator-sqlite",
      followUpDate: "2026-06-23",
      followUpItem: "sqlite跟进",
      followUpMethod: "微信",
      mallId: seeded.mall.id,
      merchantFeedback: "已记录",
      nextAction: "复查",
      nextFollowUpDate: "2026-06-24",
      ownerName: "营运A",
      periodMonth: "2026-05",
      status: "跟进中",
      storeId: seeded.honor.id,
      warningId: "W02",
    });

    const posRows = await store.listPosSales("2026-05", seeded.mall.id);
    expect(posRows).toEqual(expect.arrayContaining([expect.objectContaining({ remark: "sqlite验证" })]));
    expect(posRows[0].salesWan).toBeCloseTo(22.2, 1);
    expect(await store.resolveMerchantFillPeriods(seeded.mall.id, new Date("2026-06-23T00:00:00.000Z"))).toEqual(expect.arrayContaining([expect.objectContaining({ status: "reopened" })]));
    expect(await store.listFollowUps("2026-05", seeded.mall.id)).toEqual(expect.arrayContaining([expect.objectContaining({ followUpItem: "sqlite跟进", warningId: "W02" })]));
  });
});

function metric(periodMonth: string, salesPerStaff: number, staffCount: number | null): SurveyMonthlyMetric {
  return {
    areaSqmSnapshot: 100,
    effectiveSalesWan: salesPerStaff * (staffCount || 1),
    fieldValues: { mainPromotion: "新品" },
    isLate: false,
    merchantSalesWan: null,
    momRate: null,
    periodMonth,
    posSalesWan: null,
    salesPerSqm: null,
    salesPerStaff,
    salesSource: "pos",
    salesTargetWan: null,
    selfPosDiffRate: null,
    selfPosDiffWan: null,
    staffCountSnapshot: staffCount,
    storeId: "store-1",
    targetCompletionRate: null,
    yoyRate: null,
  };
}
