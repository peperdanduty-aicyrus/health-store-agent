import { anonymizeReportSnapshot, restoreReportStoreNames } from "./anonymization";
import { createDeepSeekReportProvider, createMockReportProvider } from "./deepseek";
import { buildSurveyReportPrompt } from "./report-prompts";
import { getReportSchemaInstruction, normalizeReportJson, parseReportJson, validateReportJson } from "./report-schema";
import type { SurveyGenerateReportResult, SurveyReportProvider, SurveyReportSnapshot } from "./report-types";
import type { SurveyReportType, SurveyStore } from "../survey/types";

type SurveyReportStore = {
  createSurveyAiReportJob: Function;
  createSurveyReportSnapshot: Function;
  createSurveyReportWithVersion: Function;
  getMerchantSubmissionForStoreMonth: Function;
  listFollowUps: Function;
  listMonthlyMetrics: Function;
  listPeerSalesRows: Function;
  listStores: Function;
  listWarningRecords: Function;
};

export async function generateSurveyReport({
  actorId,
  mallId,
  periodMonth,
  provider = createDefaultReportProvider(),
  reportType,
  store,
}: {
  actorId: string;
  mallId: string;
  periodMonth: string;
  provider?: SurveyReportProvider;
  reportType: SurveyReportType;
  store: SurveyReportStore;
}): Promise<SurveyGenerateReportResult> {
  const snapshot = await buildSurveyReportSnapshot(store, mallId, periodMonth);
  const anonymized = anonymizeReportSnapshot(snapshot);
  const prompt = buildSurveyReportPrompt(reportType, anonymized.input);
  let providerResult;
  try {
    providerResult = await provider.completeJson({ prompt, reportType });
    const { parsed, repairAttempted } = await parseAndValidateWithOneRepair(provider, reportType, prompt, providerResult);
    const restored = restoreReportStoreNames(parsed, anonymized.mapping);
    const snapshotRecord = await store.createSurveyReportSnapshot({
      createdBy: actorId,
      desensitizedInputJson: JSON.stringify(anonymized.input),
      mallId,
      periodMonth,
      reportType,
      snapshotJson: JSON.stringify(snapshot),
    });
    const job = await store.createSurveyAiReportJob({
      createdBy: actorId,
      desensitizedInputJson: JSON.stringify(anonymized.input),
      elapsedMs: providerResult.elapsedMs,
      inputSnapshotJson: JSON.stringify(snapshot),
      mallId,
      modelName: providerResult.model,
      modelProvider: providerResult.provider,
      outputText: providerResult.content,
      periodMonth,
      reportType,
      status: "succeeded",
      tokenUsageJson: JSON.stringify({ ...(providerResult.usage ?? {}), repair_attempted: repairAttempted }),
    });
    const report = await store.createSurveyReportWithVersion({
      actorId,
      aiRawJson: providerResult.content,
      contentJson: JSON.stringify(restored),
      jobId: job.id,
      mallId,
      periodMonth,
      reportType,
      snapshotId: snapshotRecord.id,
      title: getReportTitle(reportType, periodMonth),
      versionNote: "AI原始版本",
    });
    return { jobId: job.id, reportId: report.id, status: "succeeded" };
  } catch (error) {
    const err = error as Error & { code?: string; model?: string; provider?: string };
    const job = await store.createSurveyAiReportJob({
      createdBy: actorId,
      desensitizedInputJson: JSON.stringify(anonymized.input),
      elapsedMs: providerResult?.elapsedMs ?? null,
      errorCode: err.code ?? "unknown",
      errorMessage: err.message,
      inputSnapshotJson: JSON.stringify(snapshot),
      mallId,
      modelName: providerResult?.model ?? err.model ?? "unknown",
      modelProvider: providerResult?.provider ?? err.provider ?? "unknown",
      outputText: providerResult?.content ?? "",
      periodMonth,
      reportType,
      status: "failed",
      tokenUsageJson: JSON.stringify(providerResult?.usage ?? {}),
    });
    return { errorMessage: err.message, jobId: job.id, status: "failed" };
  }
}

async function parseAndValidateWithOneRepair(provider: SurveyReportProvider, reportType: SurveyReportType, prompt: string, firstResult: Awaited<ReturnType<SurveyReportProvider["completeJson"]>>) {
  const first = parseNormalizeAndValidate(reportType, firstResult.content);
  if (first.valid) return { parsed: first.parsed, repairAttempted: false };

  const repair = await provider.completeJson({
    prompt: [
      prompt,
      "",
      "上一次输出不是合法JSON或不符合Schema。",
      `Schema错误：${first.errors.join("; ")}`,
      "目标JSON结构：",
      getReportSchemaInstruction(reportType),
      "上一次输出：",
      firstResult.content,
      "请只返回一个修复后的合法JSON对象，不要输出解释文字，不要新增目标结构以外的顶层字段。",
    ].join("\n"),
    reportType,
  });
  Object.assign(firstResult, {
    ...repair,
    elapsedMs: (firstResult.elapsedMs ?? 0) + repair.elapsedMs,
    usage: { ...mergeUsage(firstResult.usage, repair.usage), repair_attempted: true },
  });
  const second = parseNormalizeAndValidate(reportType, repair.content);
  if (!second.valid) {
    throw Object.assign(new Error(`AI返回JSON结构不合法：${second.errors.join("; ")}`), { code: "schema_invalid" });
  }
  return { parsed: second.parsed, repairAttempted: true };
}

function parseNormalizeAndValidate(reportType: SurveyReportType, content: string): { errors: string[]; parsed: unknown; valid: boolean } {
  try {
    const parsed = normalizeReportJson(reportType, parseReportJson(content));
    const schema = validateReportJson(reportType, parsed);
    return { errors: schema.errors, parsed, valid: schema.valid };
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON解析失败";
    return { errors: [message], parsed: null, valid: false };
  }
}

function mergeUsage(first: Record<string, unknown> | null, second: Record<string, unknown> | null) {
  const merged: Record<string, unknown> = { ...(first ?? {}) };
  for (const [key, value] of Object.entries(second ?? {})) {
    if (typeof value === "number" && typeof merged[key] === "number") {
      merged[key] = (merged[key] as number) + value;
    } else {
      merged[`repair_${key}`] = value;
    }
  }
  return merged;
}

export async function buildSurveyReportSnapshot(store: SurveyReportStore, mallId: string, periodMonth: string): Promise<SurveyReportSnapshot> {
  const stores = ((await store.listStores()) as SurveyStore[]).filter((item) => item.mallId === mallId && item.status === "active");
  const [metrics, warnings, followUps] = await Promise.all([
    store.listMonthlyMetrics(periodMonth, mallId),
    store.listWarningRecords(periodMonth, mallId),
    store.listFollowUps(periodMonth, mallId),
  ]);
  const metricByStore = new Map<string, any>(metrics.map((item: any) => [item.storeId, item]));
  const warningsByStore = groupBy(warnings as Array<{ code: string; storeId: string }>, (item) => item.storeId);
  const followUpsByStore = groupBy(followUps as Array<{ followUpItem: string; status: string; storeId: string }>, (item) => item.storeId);
  const rows = [];
  for (const item of stores) {
    const metric = metricByStore.get(item.id);
    const submission = await store.getMerchantSubmissionForStoreMonth(item.id, periodMonth);
    const peerRows = submission ? await store.listPeerSalesRows(submission.id) : [];
    const fieldValues = safeJson(submission?.fieldValuesJson);
    rows.push({
      category: item.subcategoryName || item.categoryName,
      followUpSummary: (followUpsByStore.get(item.id) ?? []).map((followUp) => ({ status: followUp.status, subject: followUp.followUpItem })),
      merchantInput: {
        mainPromotion: String(fieldValues.main_promotion ?? ""),
        nextActionPlan: String(fieldValues.next_action_plan ?? ""),
        otherReasonText: fieldValues.other_reason_text ? String(fieldValues.other_reason_text) : null,
        reasonCodes: toStringArray(fieldValues.improvement_reason_codes ?? fieldValues.decline_reason_codes),
        selfRating: String(fieldValues.business_self_rating ?? ""),
      },
      metrics: {
        effectiveSalesWan: metric?.effectiveSalesWan ?? null,
        momRate: metric?.momRate ?? null,
        peerGapRate: null,
        salesPerSqm: metric?.salesPerSqm ?? null,
        salesPerStaff: metric?.salesPerStaff ?? null,
        salesSource: metric?.salesSource ?? "missing",
        selfPosDiffRate: metric?.selfPosDiffRate ?? null,
        targetCompletionRate: metric?.targetCompletionRate ?? null,
        yoyRate: metric?.yoyRate ?? null,
      },
      peerReference: {
        peerAverageSalesWan: average(peerRows.map((row: { salesWan: number }) => row.salesWan)),
        peerCount: peerRows.length,
        peerGapRate: null,
      },
      storeId: item.id,
      storeName: item.brandName || item.storeName,
      warningFlags: (warningsByStore.get(item.id) ?? []).map((warning) => warning.code),
    });
  }
  const activeMetrics = rows.map((row) => row.metrics).filter((metric) => metric.effectiveSalesWan !== null);
  const totalSales = activeMetrics.reduce((sum, metric) => sum + (metric.effectiveSalesWan ?? 0), 0);
  const totalTarget = activeMetrics.reduce((sum, metric) => sum + (metric.targetCompletionRate && metric.effectiveSalesWan ? metric.effectiveSalesWan / metric.targetCompletionRate : 0), 0);
  const categoryMetrics = Array.from(groupBy(rows, (row) => row.category)).map(([category, categoryRows]) => {
    const categorySales = categoryRows.reduce((sum, row) => sum + (row.metrics.effectiveSalesWan ?? 0), 0);
    const categoryTarget = categoryRows.reduce((sum, row) => sum + (row.metrics.targetCompletionRate && row.metrics.effectiveSalesWan ? row.metrics.effectiveSalesWan / row.metrics.targetCompletionRate : 0), 0);
    return {
      category,
      downStoreCount: categoryRows.filter((row) => (row.metrics.momRate ?? 0) < 0).length,
      momRate: null,
      salesWan: round(totalSales ? categorySales : 0),
      targetCompletionRate: categoryTarget ? round(categorySales / categoryTarget, 4) : null,
      upStoreCount: categoryRows.filter((row) => (row.metrics.momRate ?? 0) > 0).length,
      yoyRate: null,
    };
  });
  return {
    categoryMetrics,
    dataQuality: {
      activeStoreCount: stores.length,
      posCoverageRate: stores.length ? round(rows.filter((row) => row.metrics.salesSource === "pos").length / stores.length, 4) : 0,
      posStoreCount: rows.filter((row) => row.metrics.salesSource === "pos").length,
      submissionRate: stores.length ? round(rows.filter((row) => row.merchantInput.selfRating).length / stores.length, 4) : 0,
      submittedStoreCount: rows.filter((row) => row.merchantInput.selfRating).length,
      yoyAvailableStoreCount: rows.filter((row) => row.metrics.yoyRate !== null).length,
    },
    generatedAt: new Date().toISOString(),
    mallId,
    overallMetrics: {
      criticalStoreCount: rows.filter((row) => row.warningFlags.length).length,
      momRate: null,
      salesWan: round(totalSales),
      targetCompletionRate: totalTarget ? round(totalSales / totalTarget, 4) : null,
      warningCount: (warnings as unknown[]).length,
      yoyRate: null,
    },
    periodMonth,
    reasonStatistics: { declineReasons: [], growthReasons: [] },
    specialMetrics: { education: [], kidsEntertainment: [] },
    storeMap: rows.map((row, index) => ({ anonymousId: `STORE_${String(index + 1).padStart(3, "0")}`, displayName: row.storeName, storeId: row.storeId })),
    stores: rows,
  };
}

function createDefaultReportProvider(): SurveyReportProvider {
  if (process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY) return createDeepSeekReportProvider();
  return createMockReportProvider("success");
}

function getReportTitle(reportType: SurveyReportType, periodMonth: string) {
  const names: Record<SurveyReportType, string> = {
    full_analysis: "完整经营分析报告",
    leadership_brief: "领导简报",
    oral_briefing: "口头汇报稿",
    store_analysis: "单店重点问题分析卡",
  };
  return `${periodMonth} ${names[reportType]}`;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

function safeJson(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value) return [value];
  return [];
}

function average(values: number[]) {
  return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
