import type { SurveyMonthlyMetric, SurveyMonthlyMetricInput, SurveyPeerSalesRow, SurveyWarning } from "./types";

export function computeMonthlyMetric(input: SurveyMonthlyMetricInput): SurveyMonthlyMetric {
  const effectiveSalesWan = input.posSalesWan ?? input.merchantSalesWan ?? null;
  const salesSource = input.posSalesWan !== null && input.posSalesWan !== undefined
    ? "pos"
    : input.merchantSalesWan !== null && input.merchantSalesWan !== undefined
      ? "merchant"
      : "missing";

  return {
    areaSqmSnapshot: input.areaSqm ?? null,
    effectiveSalesWan,
    fieldValues: input.fieldValues,
    isLate: input.isLate,
    merchantSalesWan: input.merchantSalesWan ?? null,
    momRate: divideRate(effectiveSalesWan, input.previousMonthEffectiveSalesWan),
    periodMonth: input.periodMonth,
    posSalesWan: input.posSalesWan ?? null,
    salesPerSqm: divideValue(effectiveSalesWan, input.areaSqm),
    salesPerStaff: divideValue(effectiveSalesWan, input.staffCount),
    salesSource,
    salesTargetWan: input.salesTargetWan ?? null,
    selfPosDiffRate: input.posSalesWan ? divideValue((input.merchantSalesWan ?? 0) - input.posSalesWan, input.posSalesWan) : null,
    selfPosDiffWan: input.posSalesWan !== null && input.posSalesWan !== undefined && input.merchantSalesWan !== null && input.merchantSalesWan !== undefined
      ? input.merchantSalesWan - input.posSalesWan
      : null,
    staffCountSnapshot: input.staffCount ?? null,
    storeId: input.storeId,
    targetCompletionRate: divideValue(effectiveSalesWan, input.salesTargetWan),
    yoyRate: divideRate(effectiveSalesWan, input.sameMonthLastYearEffectiveSalesWan),
  };
}

export function evaluateStoreWarnings(input: {
  current: SurveyMonthlyMetric;
  peerRows: SurveyPeerSalesRow[];
  previousMetrics: SurveyMonthlyMetric[];
}): SurveyWarning[] {
  const warnings: SurveyWarning[] = [];
  const current = input.current;
  if (current.momRate !== null && current.momRate < -0.1) {
    warnings.push(warning("W01", "环比下降超过10%", "重要"));
  }
  if (current.targetCompletionRate !== null && current.targetCompletionRate < 0.8) {
    warnings.push(warning("W02", "目标完成率低于80%", "重要"));
  }
  if ([current, ...input.previousMetrics].slice(0, 2).every((metric) => metric.momRate !== null && metric.momRate < 0)) {
    warnings.push(warning("W03", "连续两个月销售下降", "严重"));
  }
  if ([current, ...input.previousMetrics].slice(0, 2).every((metric) => metric.targetCompletionRate !== null && metric.targetCompletionRate < 1)) {
    warnings.push(warning("W04", "连续两个月未完成目标", "严重"));
  }
  if (current.selfPosDiffRate !== null && Math.abs(current.selfPosDiffRate) > 0.1) {
    warnings.push(warning("W05", "商户自报与POS差异绝对值超过10%", "一般"));
  }
  if ([current, ...input.previousMetrics].slice(0, 2).every((metric) => metric.isLate)) {
    warnings.push(warning("W06", "连续两个月逾期提交", "一般"));
  }
  if (current.fieldValues.inventoryStatus === "主推品库存不足") {
    warnings.push(warning("W07", "主推品库存不足", "重要"));
  }
  if (current.fieldValues.inventoryStatus === "滞销品偏多") {
    warnings.push(warning("W08", "滞销库存偏多", "重要"));
  }
  const staffComparableMonths = [current, ...input.previousMetrics]
    .slice(0, 3)
    .filter((metric) => metric.staffCountSnapshot !== null && metric.salesPerStaff !== null);
  if (
    staffComparableMonths.length >= 3 &&
    staffComparableMonths[0].salesPerStaff !== null &&
    staffComparableMonths[1].salesPerStaff !== null &&
    staffComparableMonths[2].salesPerStaff !== null &&
    staffComparableMonths[0].salesPerStaff < staffComparableMonths[1].salesPerStaff &&
    staffComparableMonths[1].salesPerStaff < staffComparableMonths[2].salesPerStaff
  ) {
    warnings.push(warning("W10", "基于月度员工人数快照的人效连续下降", "重要"));
  }
  if (hasNoMainPromotion(current.fieldValues.mainPromotion) && input.previousMetrics.some((metric) => hasNoMainPromotion(metric.fieldValues.mainPromotion))) {
    warnings.push(warning("W11", "连续两个月没有新品或主推活动", "一般"));
  }
  if (input.peerRows.length === 0) {
    warnings.push(warning("W12", "同城对标信息长期缺失", "一般"));
  }
  return warnings;
}

export function getStaffEfficiencyWarningStatus(input: { current: SurveyMonthlyMetric; previousMetrics: SurveyMonthlyMetric[] }) {
  const staffComparableMonths = [input.current, ...input.previousMetrics]
    .slice(0, 3)
    .filter((metric) => metric.staffCountSnapshot !== null && metric.salesPerStaff !== null);
  if (staffComparableMonths.length < 3) {
    return "待数据积累";
  }
  return staffComparableMonths[0].salesPerStaff! < staffComparableMonths[1].salesPerStaff! && staffComparableMonths[1].salesPerStaff! < staffComparableMonths[2].salesPerStaff!
    ? "触发"
    : "正常";
}

export function calculateEntertainmentMetrics(input: {
  effectiveSalesWan: number | null;
  memberRechargeWan: number | null;
  newMemberCount: number | null;
  paidVisitorCount: number | null;
  renewMemberCount: number | null;
  visitCount: number | null;
}) {
  return {
    memberRechargeRate: divideValue(input.memberRechargeWan, input.effectiveSalesWan),
    newMemberRate: divideValue(input.newMemberCount, input.paidVisitorCount),
    paidConversionRate: divideValue(input.paidVisitorCount, input.visitCount),
    renewMemberRate: divideValue(input.renewMemberCount, input.paidVisitorCount),
  };
}

export function calculateEducationMetrics(input: {
  currentStudentCount: number | null;
  effectiveSalesWan: number | null;
  newContractWan: number | null;
  newLeadCount: number | null;
  newStudentCount: number | null;
  refundStudentCount: number | null;
  renewContractWan: number | null;
  trialClassCount: number | null;
  visitCount: number | null;
}) {
  return {
    leadVisitRate: divideValue(input.visitCount, input.newLeadCount),
    newContractSalesRate: divideValue(input.newContractWan, input.effectiveSalesWan),
    refundRate: divideValue(input.refundStudentCount, input.currentStudentCount),
    renewContractSalesRate: divideValue(input.renewContractWan, input.effectiveSalesWan),
    trialDealRate: divideValue(input.newStudentCount, input.trialClassCount),
    visitTrialRate: divideValue(input.trialClassCount, input.visitCount),
  };
}

export function parsePosPaste(text: string): Array<Array<number | null>> {
  return text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) =>
      line.split("\t").map((cell) => {
        const normalized = cell.replace(/,/g, "").trim();
        const value = Number(normalized);
        return Number.isFinite(value) ? value : null;
      }),
    );
}

export function summarizeOperatorDashboard(input: {
  activeStoreCount: number;
  followUps: Array<{ nextFollowUpDate?: string | null; status: string }>;
  metrics: SurveyMonthlyMetric[];
  submissions: Array<{ isLate: boolean; storeId: string }>;
}) {
  const validMetrics = input.metrics.filter((metric) => metric.effectiveSalesWan !== null);
  const totalSalesWan = validMetrics.reduce((sum, metric) => sum + (metric.effectiveSalesWan ?? 0), 0);
  const filledStores = new Set(input.submissions.map((submission) => submission.storeId));
  const targetReached = validMetrics.filter((metric) => metric.targetCompletionRate !== null && metric.targetCompletionRate >= 1).length;
  const targetMissed = validMetrics.filter((metric) => metric.targetCompletionRate !== null && metric.targetCompletionRate < 1).length;
  return {
    completionRate: input.activeStoreCount ? filledStores.size / input.activeStoreCount : 0,
    filledCount: filledStores.size,
    lateCount: input.submissions.filter((submission) => submission.isLate).length,
    missingCount: Math.max(input.activeStoreCount - filledStores.size, 0),
    targetMissed,
    targetReached,
    totalSalesWan,
  };
}

export function evaluateFollowUpBuckets(
  followUps: Array<{ nextFollowUpDate?: string | null; status: string; storeId: string }>,
  now = new Date(),
) {
  const today = now.toISOString().slice(0, 10);
  return {
    overdue: followUps.filter((item) => item.nextFollowUpDate && item.nextFollowUpDate < today && !["已完成", "暂不处理"].includes(item.status)).length,
    review: followUps.filter((item) => item.status === "待复查").length,
    today: followUps.filter((item) => item.nextFollowUpDate === today && !["已完成", "暂不处理"].includes(item.status)).length,
  };
}

function divideRate(current: number | null, previous: number | null | undefined): number | null {
  if (current === null || previous === null || previous === undefined || previous === 0) {
    return null;
  }
  return (current - previous) / previous;
}

function divideValue(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator === null || numerator === undefined || denominator === null || denominator === undefined || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

function warning(code: string, message: string, severity: SurveyWarning["severity"]): SurveyWarning {
  return { code, message, severity };
}

function hasNoMainPromotion(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0 || ["无", "没有", "暂无"].includes(value.trim());
}
