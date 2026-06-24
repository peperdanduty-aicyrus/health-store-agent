import { computeMonthlyMetric, evaluateFollowUpBuckets, evaluateStoreWarnings } from "./analytics";
import type { SurveyMonthlyMetric, SurveyStore, SurveyWarning } from "./types";

export type OperatorStoreRow = {
  metric: SurveyMonthlyMetric;
  store: SurveyStore;
  warnings: SurveyWarning[];
};

export type OperatorFollowUp = {
  nextFollowUpDate: string;
  owner: string;
  status: string;
  storeId: string;
  storeName: string;
  subject: string;
};

export function buildOperatorDataset(stores: SurveyStore[], periodMonth = "2026-05") {
  const activeStores = stores.filter((store) => store.status === "active");
  const rows: OperatorStoreRow[] = activeStores.map((store, index) => {
    const posSalesWan = round((index % 9) * 8 + store.areaSqm / 12 + 18);
    const merchantSalesWan = round(posSalesWan * (index % 5 === 0 ? 0.84 : index % 4 === 0 ? 1.12 : 0.97));
    const salesTargetWan = round(posSalesWan * (index % 6 === 0 ? 1.35 : 1.08));
    const previous = round(posSalesWan * (index % 7 === 0 ? 1.24 : 0.9));
    const lastYear = round(posSalesWan * (index % 8 === 0 ? 1.18 : 0.82));
    const fieldValues = {
      inventoryStatus: index % 11 === 0 ? "主推品库存不足" : index % 13 === 0 ? "滞销品偏多" : "库存合理",
      mainPromotion: index % 10 === 0 ? "" : "主推新品和会员活动",
    };
    const metric = computeMonthlyMetric({
      areaSqm: store.areaSqm,
      fieldValues,
      isLate: index % 12 === 0,
      merchantSalesWan,
      periodMonth,
      posSalesWan,
      previousMonthEffectiveSalesWan: previous,
      salesTargetWan,
      sameMonthLastYearEffectiveSalesWan: lastYear,
      staffCount: store.staffCount,
      storeId: store.id,
    });
    const previousMetric = { ...metric, isLate: index % 12 === 0, momRate: index % 7 === 0 ? -0.03 : 0.04, targetCompletionRate: index % 6 === 0 ? 0.7 : 1.05 };
    return {
      metric,
      store,
      warnings: evaluateStoreWarnings({
        current: metric,
        peerRows: index % 9 === 0 ? [] : [{ mallName: "同城商场", salesWan: round(posSalesWan * 0.9) }],
        previousMetrics: [previousMetric],
      }),
    };
  });
  const followUps: OperatorFollowUp[] = rows
    .filter((row) => row.warnings.length > 0)
    .slice(0, 12)
    .map((row, index) => ({
      nextFollowUpDate: index % 3 === 0 ? "2026-06-23" : index % 3 === 1 ? "2026-06-20" : "2026-06-28",
      owner: "营运测试账号",
      status: index % 3 === 2 ? "待复查" : "待联系",
      storeId: row.store.id,
      storeName: row.store.brandName,
      subject: row.warnings[0]?.message ?? "经营跟进",
    }));
  return {
    activeStores,
    categorySummaries: summarizeBySubcategory(rows),
    followUpBuckets: evaluateFollowUpBuckets(followUps, new Date("2026-06-23T00:00:00.000Z")),
    followUps,
    periodMonth,
    rows,
    warningRows: rows.flatMap((row) => row.warnings.map((warning) => ({ ...warning, store: row.store, metric: row.metric }))),
  };
}

export function formatWan(value: number | null | undefined): string {
  return value === null || value === undefined ? "暂无数据" : `${round(value)}万`;
}

export function formatRate(value: number | null | undefined): string {
  return value === null || value === undefined ? "暂无数据" : `${round(value * 100)}%`;
}

function summarizeBySubcategory(rows: OperatorStoreRow[]) {
  const groups = new Map<string, OperatorStoreRow[]>();
  for (const row of rows) {
    const key = row.store.subcategoryName || row.store.categoryName;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return Array.from(groups.entries()).map(([subcategoryName, items]) => {
    const totalSalesWan = round(items.reduce((sum, item) => sum + (item.metric.effectiveSalesWan ?? 0), 0));
    const target = items.reduce((sum, item) => sum + (item.metric.salesTargetWan ?? 0), 0);
    return {
      downCount: items.filter((item) => (item.metric.momRate ?? 0) < 0).length,
      storeCount: items.length,
      subcategoryName,
      targetCompletionRate: target ? totalSalesWan / target : null,
      totalSalesWan,
      upCount: items.filter((item) => (item.metric.momRate ?? 0) > 0).length,
    };
  });
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
