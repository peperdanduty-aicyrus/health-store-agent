import { describe, expect, it } from "vitest";
import {
  calculateEducationMetrics,
  calculateEntertainmentMetrics,
  computeMonthlyMetric,
  evaluateFollowUpBuckets,
  evaluateStoreWarnings,
  parsePosPaste,
  summarizeOperatorDashboard,
} from "./analytics";
import type { SurveyMonthlyMetricInput } from "./types";

const baseInput: SurveyMonthlyMetricInput = {
  areaSqm: 50,
  fieldValues: {},
  isLate: false,
  merchantSalesWan: 90,
  periodMonth: "2026-05",
  posSalesWan: 100,
  previousMonthEffectiveSalesWan: 80,
  salesTargetWan: 120,
  sameMonthLastYearEffectiveSalesWan: 50,
  staffCount: 5,
  storeId: "store_001",
};

describe("survey deterministic analytics", () => {
  it("uses POS first, merchant sales second, and missing when both are unavailable", () => {
    expect(computeMonthlyMetric(baseInput)).toMatchObject({
      effectiveSalesWan: 100,
      salesSource: "pos",
    });
    expect(computeMonthlyMetric({ ...baseInput, posSalesWan: null })).toMatchObject({
      effectiveSalesWan: 90,
      salesSource: "merchant",
    });
    expect(computeMonthlyMetric({ ...baseInput, merchantSalesWan: null, posSalesWan: null })).toMatchObject({
      effectiveSalesWan: null,
      salesSource: "missing",
    });
  });

  it("computes rates and leaves denominator-zero results blank instead of zero", () => {
    expect(computeMonthlyMetric(baseInput)).toMatchObject({
      momRate: 0.25,
      salesPerSqm: 2,
      salesPerStaff: 20,
      selfPosDiffRate: -0.1,
      selfPosDiffWan: -10,
      targetCompletionRate: 100 / 120,
      yoyRate: 1,
    });
    expect(
      computeMonthlyMetric({
        ...baseInput,
        areaSqm: 0,
        previousMonthEffectiveSalesWan: 0,
        salesTargetWan: 0,
        sameMonthLastYearEffectiveSalesWan: null,
        staffCount: 0,
      }),
    ).toMatchObject({
      momRate: null,
      salesPerSqm: null,
      salesPerStaff: null,
      targetCompletionRate: null,
      yoyRate: null,
    });
  });

  it("generates the 11 enabled warnings and keeps W09 contract-expiry disabled", () => {
    const metric = computeMonthlyMetric({
      ...baseInput,
      fieldValues: { inventoryStatus: "主推品库存不足", mainPromotion: "" },
      isLate: true,
      merchantSalesWan: 70,
      posSalesWan: 100,
      previousMonthEffectiveSalesWan: 120,
      salesTargetWan: 150,
    });
    const warnings = evaluateStoreWarnings({
      current: metric,
      previousMetrics: [
        { ...metric, isLate: true, momRate: -0.05, targetCompletionRate: 0.7 },
        { ...metric, momRate: -0.04, targetCompletionRate: 0.75 },
      ],
      peerRows: [],
    });

    expect(warnings.map((item) => item.code)).toEqual(expect.arrayContaining(["W01", "W02", "W03", "W04", "W05", "W06", "W07", "W11", "W12"]));
    expect(warnings.map((item) => item.code)).not.toContain("W09");
  });

  it("does not treat missing sales as a decline warning", () => {
    const metric = computeMonthlyMetric({ ...baseInput, merchantSalesWan: null, posSalesWan: null, previousMonthEffectiveSalesWan: 100 });
    expect(evaluateStoreWarnings({ current: metric, previousMetrics: [], peerRows: [] }).map((item) => item.code)).not.toContain("W01");
  });

  it("computes children entertainment and education funnel metrics", () => {
    expect(
      calculateEntertainmentMetrics({
        effectiveSalesWan: 40,
        memberRechargeWan: 8,
        newMemberCount: 80,
        paidVisitorCount: 400,
        renewMemberCount: 60,
        visitCount: 1000,
      }),
    ).toMatchObject({
      memberRechargeRate: 0.2,
      newMemberRate: 0.2,
      paidConversionRate: 0.4,
      renewMemberRate: 0.15,
    });

    expect(
      calculateEducationMetrics({
        currentStudentCount: 100,
        effectiveSalesWan: 80,
        newContractWan: 40,
        newLeadCount: 100,
        newStudentCount: 20,
        refundStudentCount: 5,
        renewContractWan: 20,
        trialClassCount: 40,
        visitCount: 50,
      }),
    ).toMatchObject({
      leadVisitRate: 0.5,
      newContractSalesRate: 0.5,
      refundRate: 0.05,
      renewContractSalesRate: 0.25,
      trialDealRate: 0.5,
      visitTrialRate: 0.8,
    });
  });

  it("parses Excel one-column and multi-column POS paste blocks", () => {
    expect(parsePosPaste("10\n20\n30")).toEqual([[10], [20], [30]]);
    expect(parsePosPaste("10\t12\nabc\t14")).toEqual([[10, 12], [null, 14]]);
  });

  it("summarizes dashboard and follow-up buckets without counting missing values as zero", () => {
    const metric = computeMonthlyMetric(baseInput);
    const missing = computeMonthlyMetric({ ...baseInput, storeId: "store_002", merchantSalesWan: null, posSalesWan: null });
    expect(summarizeOperatorDashboard({ activeStoreCount: 3, followUps: [], metrics: [metric, missing], submissions: [{ isLate: false, storeId: "store_001" }] })).toMatchObject({
      completionRate: 1 / 3,
      filledCount: 1,
      missingCount: 2,
      totalSalesWan: 100,
    });
    expect(
      evaluateFollowUpBuckets([
        { nextFollowUpDate: "2026-06-23", status: "待联系", storeId: "store_001" },
        { nextFollowUpDate: "2026-06-20", status: "整改中", storeId: "store_002" },
        { nextFollowUpDate: "2026-06-25", status: "待复查", storeId: "store_003" },
      ], new Date("2026-06-23T00:00:00.000Z")),
    ).toMatchObject({ overdue: 1, review: 1, today: 1 });
  });
});
