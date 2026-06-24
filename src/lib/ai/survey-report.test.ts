import { describe, expect, it, vi } from "vitest";
import { createSurveyMemoryStore, defaultSurveyCategoryNames } from "../survey/store";
import type { SurveyStore } from "../survey/types";
import { anonymizeReportSnapshot, restoreReportStoreNames } from "./anonymization";
import { createPrintableReportHtml, exportReportDocx } from "./report-export";
import { generateSurveyReport } from "./report-service";
import { normalizeReportJson, parseReportJson, validateReportJson } from "./report-schema";
import type { SurveyReportSnapshot } from "./report-types";

const mallId = "survey_mall_001";
const periodMonth = "2026-05";

function sampleStore(overrides: Partial<SurveyStore> = {}): SurveyStore {
  return {
    areaSqm: 65,
    brandId: "brand_001",
    brandName: "荣耀 honor",
    categoryId: "survey_category_001",
    categoryName: "3C数码",
    chainStore: true,
    contactPhone: "13800000000",
    contractEndDate: "2027-12-31",
    contractStartDate: "2025-01-01",
    createdAt: "2026-06-23T00:00:00.000Z",
    displayLocation: "B1-001",
    floor: "B1",
    formCategoryCode: "3C_DIGITAL",
    id: "store_real_001",
    mallId,
    mallName: "第一版测试商场",
    managerName: "张店长",
    operationMode: "直营",
    operatorName: "王营运",
    rentMode: "固定租金",
    searchText: "荣耀 honor",
    staffCount: 5,
    status: "active",
    storeCode: "B0177N001",
    storeName: "荣耀 honor",
    subcategoryId: "subcategory_001",
    subcategoryName: "3C数码",
    unitNo: "001",
    updatedAt: "2026-06-23T00:00:00.000Z",
    ...overrides,
  };
}

function sampleSnapshot(): SurveyReportSnapshot {
  return {
    mallId,
    periodMonth,
    dataQuality: {
      activeStoreCount: 1,
      posCoverageRate: 1,
      posStoreCount: 1,
      submissionRate: 1,
      submittedStoreCount: 1,
      yoyAvailableStoreCount: 0,
    },
    generatedAt: "2026-06-24T00:00:00.000Z",
    overallMetrics: {
      criticalStoreCount: 1,
      momRate: null,
      salesWan: 19.9,
      targetCompletionRate: 1.1371,
      warningCount: 2,
      yoyRate: null,
    },
    categoryMetrics: [
      {
        category: "3C数码",
        downStoreCount: 0,
        momRate: null,
        salesWan: 19.9,
        targetCompletionRate: 1.1371,
        upStoreCount: 0,
        yoyRate: null,
      },
    ],
    reasonStatistics: { declineReasons: [], growthReasons: [] },
    specialMetrics: { education: [], kidsEntertainment: [] },
    storeMap: [{ anonymousId: "STORE_001", displayName: "荣耀 honor", storeId: "store_real_001" }],
    stores: [
      {
        category: "3C数码",
        followUpSummary: [{ status: "待复查", subject: "POS差异跟进" }],
        merchantInput: {
          mainPromotion: "Mate系列新品",
          nextActionPlan: "补货并强化话术",
          otherReasonText: null,
          reasonCodes: ["new_product_growth"],
          selfRating: "小幅提升",
        },
        metrics: {
          effectiveSalesWan: 19.9,
          momRate: null,
          peerGapRate: null,
          salesPerSqm: 0.3062,
          salesPerStaff: 3.98,
          salesSource: "pos",
          selfPosDiffRate: -0.063,
          targetCompletionRate: 1.1371,
          yoyRate: null,
        },
        peerReference: { peerAverageSalesWan: null, peerCount: 0, peerGapRate: null },
        storeId: "store_real_001",
        storeName: "荣耀 honor",
        warningFlags: ["W05", "W10"],
      },
    ],
  };
}

describe("survey AI report stage 5", () => {
  it("desensitizes store names, manager, phone, rent, and operator before model input", () => {
    const anonymized = anonymizeReportSnapshot(sampleSnapshot());
    const text = JSON.stringify(anonymized.input);
    expect(text).toContain("STORE_001");
    expect(text).not.toContain("荣耀");
    expect(text).not.toContain("张店长");
    expect(text).not.toContain("13800000000");
    expect(text).not.toContain("王营运");
    expect(anonymized.input.stores[0].storeId).toBe("STORE_001");
  });

  it("restores known anonymous store ids and blocks unknown ids", () => {
    const anonymized = anonymizeReportSnapshot(sampleSnapshot());
    const restored = restoreReportStoreNames(
      { focus_stores: [{ evidence: "STORE_001目标完成率1.1371", follow_up_focus: "复查", issue: "POS差异", store_id: "STORE_001" }], priorities: ["跟进STORE_001"] },
      anonymized.mapping,
    );
    expect(JSON.stringify(restored)).toContain("荣耀 honor");
    expect(JSON.stringify(restored)).not.toContain("STORE_001");
    expect(() => restoreReportStoreNames({ focus_stores: [{ store_id: "STORE_999" }] }, anonymized.mapping)).toThrow("未知脱敏门店ID");
  });

  it("normalizes the real DeepSeek leadership field drift before schema validation", () => {
    const drifted = {
      core_metrics: [{ description: "当月所有门店合计销售额82万元，目标完成率107.6%。" }],
      highlights: [{ category: "3C数码", detail: "销售额41.1万元，目标达成率109.6%。" }],
      key_stores: [{ analysis: "目标未达成，需跟进。", store_id: "STORE_039" }],
      next_month_actions: [{ action: "提升数据质量", reason: "POS覆盖率低。" }],
      one_sentence_conclusion: "本月整体销售82万元，目标达成率107.6%。",
      risks: [{ category: "数据质量", detail: "POS覆盖率低。" }],
    };
    const normalized = normalizeReportJson("leadership_brief", drifted);
    const schema = validateReportJson("leadership_brief", normalized);
    expect(schema.valid).toBe(true);
    expect(JSON.stringify(normalized)).toContain("overall_performance_summary");
    expect(JSON.stringify(normalized)).toContain("focus_stores");
    expect(JSON.stringify(normalized)).not.toContain("core_metrics");
  });

  it("extracts JSON when the provider wraps it with markdown or explanatory text", () => {
    const parsed = parseReportJson("说明文字\n```json\n{\"title\":\"口头汇报\",\"estimated_minutes\":4,\"script\":\"正文\",\"key_numbers\":[],\"speaker_notes\":[]}\n```\n结束");
    expect(validateReportJson("oral_briefing", parsed).valid).toBe(true);
  });

  it("validates all four report json schemas", () => {
    expect(validateReportJson("leadership_brief", {
      data_limitations: [],
      focus_stores: [],
      highlights: [],
      next_month_priorities: ["一", "二", "三"],
      one_sentence_conclusion: "整体稳定",
      overall_performance_summary: "销售19.9万元",
      risks: [],
    }).valid).toBe(true);
    expect(validateReportJson("full_analysis", {
      category_analysis: [],
      decline_reason_summary: "暂无数据",
      education_analysis: "暂无数据",
      efficiency_analysis: "暂无数据",
      executive_summary: "摘要",
      follow_up_analysis: "暂无数据",
      growth_reason_summary: "暂无数据",
      kids_entertainment_analysis: "暂无数据",
      next_month_plan: [],
      overall_analysis: { data_source_note: "POS优先", target: "目标完成率1.1371", trend: "暂无数据" },
      peer_benchmark_summary: "暂无数据",
      warning_store_analysis: [],
      data_limitations: [],
    }).valid).toBe(true);
    expect(validateReportJson("oral_briefing", { estimated_minutes: 4, key_numbers: ["19.9万元"], script: "各位领导，下面汇报本月情况。", speaker_notes: [], title: "口头汇报" }).valid).toBe(true);
    expect(validateReportJson("store_analysis", { key_evidence: ["目标完成率1.1371"], merchant_reason_summary: "新品带动", next_review_focus: ["补货"], operator_issue_judgement: "继续跟进", priority_actions: ["复查"], status: "待复查", store_id: "STORE_001", warning_flags: ["W05"] }).valid).toBe(true);
  });

  it("does not save illegal JSON as confirmed report and records failed job", async () => {
    const store = createSurveyMemoryStore({ categories: defaultSurveyCategoryNames.map((name, index) => ({
      createdAt: "2026-06-23T00:00:00.000Z",
      enabled: true,
      id: `survey_category_${index + 1}`,
      mallId,
      name,
      sortOrder: index + 1,
      updatedAt: "2026-06-23T00:00:00.000Z",
    })), stores: [sampleStore()] });
    const result = await generateSurveyReport({
      actorId: "staff_001",
      mallId,
      periodMonth,
      provider: { completeJson: vi.fn().mockResolvedValueOnce({ content: "{bad json", elapsedMs: 5, model: "mock-bad", provider: "mock", usage: null }) },
      reportType: "leadership_brief",
      store,
    });
    expect(result.status).toBe("failed");
    const reports = await store.listSurveyReports(mallId);
    expect(reports).toHaveLength(0);
    const jobs = await store.listSurveyAiReportJobs(mallId);
    expect(jobs[0].status).toBe("failed");
  });

  it("creates original and edited versions without overwriting the confirmed version", async () => {
    const store = createSurveyMemoryStore({ stores: [sampleStore()] });
    const report = await store.createSurveyReportWithVersion({
      actorId: "staff_001",
      aiRawJson: JSON.stringify({ one_sentence_conclusion: "原始" }),
      contentJson: JSON.stringify({ one_sentence_conclusion: "原始" }),
      jobId: "job_001",
      mallId,
      periodMonth,
      reportType: "leadership_brief",
      snapshotId: "snapshot_001",
      title: "领导简报",
      versionNote: "AI原始版本",
    });
    const edited = await store.createSurveyReportVersion({
      actorId: "staff_001",
      contentJson: JSON.stringify({ one_sentence_conclusion: "人工编辑" }),
      reportId: report.id,
      title: "领导简报-编辑",
      versionKind: "manual_edit",
      versionNote: "人工第二版",
    });
    await store.confirmSurveyReportVersion({ actorId: "staff_001", reportId: report.id, versionId: edited.id });
    await expect(store.updateConfirmedSurveyReportVersion({
      actorId: "staff_001",
      contentJson: "{}",
      reportId: report.id,
      title: "覆盖确认版",
      versionId: edited.id,
    })).rejects.toThrow("已确认版本不得直接覆盖");
    const versions = await store.listSurveyReportVersions(report.id);
    expect(versions).toHaveLength(2);
  });

  it("exports editable DOCX and printable HTML from the confirmed report content", async () => {
    const content = {
      one_sentence_conclusion: "本月销售19.9万元，目标完成率1.1371。",
      overall_performance_summary: "所有数字来自系统确定性计算。",
      highlights: [],
      risks: [],
      focus_stores: [],
      next_month_priorities: ["复查POS差异"],
      data_limitations: ["同比暂无数据"],
    };
    const docx = exportReportDocx({ content, periodMonth, reportType: "leadership_brief", title: "领导简报" });
    expect(docx.headers.contentType).toContain("wordprocessingml.document");
    expect(docx.fileName).toContain("2026年5月商场经营简报");
    expect(docx.body.slice(0, 2).toString("utf8")).toBe("PK");
    const html = createPrintableReportHtml({ content, periodMonth, reportType: "leadership_brief", title: "领导简报" });
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("本月销售19.9万元");
    expect(html).toContain("目标完成率113.7%");
    expect(html).not.toContain("DeepSeek");
    expect(html).not.toContain("1.1371");
  });
});
