import Ajv from "ajv";
import type { SurveyReportType } from "../survey/types";

const ajv = new Ajv({ allErrors: true });

const leadershipBriefSchema = {
  type: "object",
  required: ["one_sentence_conclusion", "overall_performance_summary", "highlights", "risks", "focus_stores", "next_month_priorities", "data_limitations"],
  additionalProperties: true,
  properties: {
    data_limitations: { type: "array", items: { type: "string" } },
    focus_stores: { type: "array", items: { type: "object", additionalProperties: true } },
    highlights: { type: "array", items: { type: "object", additionalProperties: true } },
    next_month_priorities: { type: "array", items: { type: "string" } },
    one_sentence_conclusion: { type: "string" },
    overall_performance_summary: { type: "string" },
    risks: { type: "array", items: { type: "object", additionalProperties: true } },
  },
} as const;

const fullAnalysisSchema = {
  type: "object",
  required: [
    "executive_summary",
    "overall_analysis",
    "category_analysis",
    "efficiency_analysis",
    "growth_reason_summary",
    "decline_reason_summary",
    "peer_benchmark_summary",
    "warning_store_analysis",
    "kids_entertainment_analysis",
    "education_analysis",
    "follow_up_analysis",
    "next_month_plan",
    "data_limitations",
  ],
  additionalProperties: true,
  properties: {
    category_analysis: { type: "array", items: { type: "object", additionalProperties: true } },
    data_limitations: { type: "array", items: { type: "string" } },
    decline_reason_summary: { type: "string" },
    education_analysis: { type: "string" },
    efficiency_analysis: { type: "string" },
    executive_summary: { type: "string" },
    follow_up_analysis: { type: "string" },
    growth_reason_summary: { type: "string" },
    kids_entertainment_analysis: { type: "string" },
    next_month_plan: { type: "array", items: { type: "object", additionalProperties: true } },
    overall_analysis: { type: "object", additionalProperties: true },
    peer_benchmark_summary: { type: "string" },
    warning_store_analysis: { type: "array", items: { type: "object", additionalProperties: true } },
  },
} as const;

const oralBriefingSchema = {
  type: "object",
  required: ["title", "estimated_minutes", "script", "key_numbers", "speaker_notes"],
  additionalProperties: true,
  properties: {
    estimated_minutes: { type: "number" },
    key_numbers: { type: "array", items: { type: "string" } },
    script: { type: "string" },
    speaker_notes: { type: "array", items: { type: "string" } },
    title: { type: "string" },
  },
} as const;

const storeAnalysisSchema = {
  type: "object",
  required: ["store_id", "status", "warning_flags", "key_evidence", "merchant_reason_summary", "operator_issue_judgement", "priority_actions", "next_review_focus"],
  additionalProperties: true,
  properties: {
    key_evidence: { type: "array", items: { type: "string" } },
    merchant_reason_summary: { type: "string" },
    next_review_focus: { type: "array", items: { type: "string" } },
    operator_issue_judgement: { type: "string" },
    priority_actions: { type: "array", items: { type: "string" } },
    status: { type: "string" },
    store_id: { type: "string" },
    warning_flags: { type: "array", items: { type: "string" } },
  },
} as const;

const validators = {
  full_analysis: ajv.compile(fullAnalysisSchema),
  leadership_brief: ajv.compile(leadershipBriefSchema),
  oral_briefing: ajv.compile(oralBriefingSchema),
  store_analysis: ajv.compile(storeAnalysisSchema),
};

const schemaExamples: Record<SurveyReportType, Record<string, unknown>> = {
  full_analysis: {
    category_analysis: [{ action: "", assessment: "", category: "", evidence: "", risk: "" }],
    data_limitations: [],
    decline_reason_summary: "",
    education_analysis: "",
    efficiency_analysis: "",
    executive_summary: "",
    follow_up_analysis: "",
    growth_reason_summary: "",
    kids_entertainment_analysis: "",
    next_month_plan: [{ action: "", check_point: "", direction: "", priority: 1, scope: "" }],
    overall_analysis: { data_source_note: "", target: "", trend: "" },
    peer_benchmark_summary: "",
    warning_store_analysis: [{ evidence: "", issue: "", priority_action: "", store_id: "STORE_001", warnings: [] }],
  },
  leadership_brief: {
    data_limitations: [],
    focus_stores: [{ evidence: "", follow_up_focus: "", issue: "", store_id: "STORE_001" }],
    highlights: [{ evidence: "", interpretation: "", title: "" }],
    next_month_priorities: ["", "", ""],
    one_sentence_conclusion: "",
    overall_performance_summary: "",
    risks: [{ action: "", evidence: "", scope: "", type: "" }],
  },
  oral_briefing: {
    estimated_minutes: 4,
    key_numbers: [""],
    script: "",
    speaker_notes: [""],
    title: "",
  },
  store_analysis: {
    key_evidence: [""],
    merchant_reason_summary: "",
    next_review_focus: [""],
    operator_issue_judgement: "",
    priority_actions: [""],
    status: "",
    store_id: "STORE_001",
    warning_flags: [],
  },
};

export function getReportSchemaInstruction(reportType: SurveyReportType) {
  return JSON.stringify(schemaExamples[reportType], null, 2);
}

export function validateReportJson(reportType: SurveyReportType, content: unknown): { errors: string[]; valid: boolean } {
  const valid = validators[reportType](content);
  return {
    errors: valid ? [] : (validators[reportType].errors ?? []).map((error) => {
      const err = error as { dataPath?: string; instancePath?: string; message?: string };
      return `${err.instancePath || err.dataPath || "/"} ${err.message || ""}`.trim();
    }),
    valid: Boolean(valid),
  };
}

export function parseReportJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const objectText = extractJsonObject(trimmed);
    if (!objectText) throw error;
    return JSON.parse(objectText);
  }
}

export function normalizeReportJson(reportType: SurveyReportType, content: unknown): unknown {
  if (!content || typeof content !== "object" || Array.isArray(content)) return content;
  const record = content as Record<string, any>;
  if (reportType === "leadership_brief") {
    return {
      data_limitations: toStringArray(record.data_limitations ?? record.limitations),
      focus_stores: normalizeFocusStores(record.focus_stores ?? record.key_stores),
      highlights: normalizeHighlights(record.highlights),
      next_month_priorities: normalizePriorities(record.next_month_priorities ?? record.next_month_actions),
      one_sentence_conclusion: stringify(record.one_sentence_conclusion ?? record.conclusion ?? ""),
      overall_performance_summary: stringify(record.overall_performance_summary ?? record.overall_summary ?? summarizeCoreMetrics(record.core_metrics)),
      risks: normalizeRisks(record.risks),
    };
  }
  if (reportType === "full_analysis") {
    return {
      category_analysis: normalizeCategoryAnalysis(record.category_analysis ?? record.category_performance),
      data_limitations: toStringArray(record.data_limitations ?? record.limitations),
      decline_reason_summary: stringify(record.decline_reason_summary ?? record.decline_analysis ?? "暂无数据"),
      education_analysis: stringify(record.education_analysis ?? record.education ?? "暂无数据"),
      efficiency_analysis: stringify(record.efficiency_analysis ?? record.ranking_efficiency_analysis ?? "暂无数据"),
      executive_summary: stringify(record.executive_summary ?? record.summary ?? ""),
      follow_up_analysis: stringify(record.follow_up_analysis ?? record.followups ?? "暂无数据"),
      growth_reason_summary: stringify(record.growth_reason_summary ?? record.growth_analysis ?? "暂无数据"),
      kids_entertainment_analysis: stringify(record.kids_entertainment_analysis ?? record.kids_entertainment ?? "暂无数据"),
      next_month_plan: normalizeNextMonthPlan(record.next_month_plan ?? record.next_month_actions),
      overall_analysis: normalizeOverallAnalysis(record.overall_analysis ?? record.overall_performance),
      peer_benchmark_summary: stringify(record.peer_benchmark_summary ?? record.peer_benchmark ?? "暂无数据"),
      warning_store_analysis: normalizeWarningStores(record.warning_store_analysis ?? record.key_stores ?? record.focus_stores),
    };
  }
  if (reportType === "oral_briefing") {
    return {
      estimated_minutes: Number(record.estimated_minutes ?? record.minutes ?? 4),
      key_numbers: toStringArray(record.key_numbers ?? record.core_numbers),
      script: stringify(record.script ?? record.speech ?? record.content ?? ""),
      speaker_notes: toStringArray(record.speaker_notes ?? record.notes),
      title: stringify(record.title ?? "月度经营口头汇报"),
    };
  }
  return {
    key_evidence: toStringArray(record.key_evidence ?? record.evidence),
    merchant_reason_summary: stringify(record.merchant_reason_summary ?? record.merchant_reason ?? "暂无数据"),
    next_review_focus: toStringArray(record.next_review_focus ?? record.review_focus),
    operator_issue_judgement: stringify(record.operator_issue_judgement ?? record.operator_judgement ?? record.analysis ?? ""),
    priority_actions: toStringArray(record.priority_actions ?? record.actions),
    status: stringify(record.status ?? "待复查"),
    store_id: stringify(record.store_id ?? record.storeId ?? ""),
    warning_flags: toStringArray(record.warning_flags ?? record.warnings),
  };
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : null;
}

function normalizeHighlights(value: unknown) {
  return toArray(value).map((item) => {
    const record = toRecord(item);
    return {
      evidence: stringify(record.evidence ?? record.detail ?? record.description ?? ""),
      interpretation: stringify(record.interpretation ?? record.analysis ?? record.detail ?? ""),
      title: stringify(record.title ?? record.category ?? record.name ?? "经营亮点"),
    };
  });
}

function normalizeRisks(value: unknown) {
  return toArray(value).map((item) => {
    const record = toRecord(item);
    return {
      action: stringify(record.action ?? record.suggestion ?? record.recommendation ?? "营运跟进"),
      evidence: stringify(record.evidence ?? record.detail ?? record.description ?? ""),
      scope: stringify(record.scope ?? record.category ?? record.store_id ?? record.store ?? "重点范围"),
      type: stringify(record.type ?? record.category ?? record.name ?? "经营风险"),
    };
  });
}

function normalizeFocusStores(value: unknown) {
  return toArray(value).map((item) => {
    const record = toRecord(item);
    return {
      evidence: stringify(record.evidence ?? record.analysis ?? record.detail ?? ""),
      follow_up_focus: stringify(record.follow_up_focus ?? record.next_action ?? record.action ?? "继续跟进"),
      issue: stringify(record.issue ?? record.analysis ?? record.detail ?? "重点关注"),
      store_id: stringify(record.store_id ?? record.storeId ?? ""),
    };
  }).filter((item) => item.store_id);
}

function normalizeCategoryAnalysis(value: unknown) {
  return toArray(value).map((item) => {
    const record = toRecord(item);
    return {
      action: stringify(record.action ?? record.priority_action ?? "营运跟进"),
      assessment: stringify(record.assessment ?? record.detail ?? record.analysis ?? ""),
      category: stringify(record.category ?? record.name ?? ""),
      evidence: stringify(record.evidence ?? record.detail ?? ""),
      risk: stringify(record.risk ?? record.issue ?? "暂无集中风险"),
    };
  }).filter((item) => item.category);
}

function normalizeWarningStores(value: unknown) {
  return toArray(value).map((item) => {
    const record = toRecord(item);
    return {
      evidence: stringify(record.evidence ?? record.analysis ?? record.detail ?? ""),
      issue: stringify(record.issue ?? record.analysis ?? record.detail ?? "重点关注"),
      priority_action: stringify(record.priority_action ?? record.action ?? "营运跟进"),
      store_id: stringify(record.store_id ?? record.storeId ?? ""),
      warnings: toStringArray(record.warnings ?? record.warning_flags),
    };
  }).filter((item) => item.store_id);
}

function normalizeNextMonthPlan(value: unknown) {
  return toArray(value).map((item, index) => {
    const record = toRecord(item);
    return {
      action: stringify(record.action ?? item),
      check_point: stringify(record.check_point ?? record.reason ?? "下月复盘"),
      direction: stringify(record.direction ?? "营运跟进"),
      priority: Number(record.priority ?? index + 1),
      scope: stringify(record.scope ?? "重点门店"),
    };
  });
}

function normalizeOverallAnalysis(value: unknown) {
  const record = toRecord(value);
  return {
    data_source_note: stringify(record.data_source_note ?? record.source_note ?? "POS优先，缺失不按0。"),
    target: stringify(record.target ?? record.target_analysis ?? ""),
    trend: stringify(record.trend ?? record.trend_analysis ?? ""),
  };
}

function normalizePriorities(value: unknown) {
  return toArray(value).map((item) => {
    const record = toRecord(item);
    return stringify(record.action ?? record.direction ?? item);
  }).filter(Boolean);
}

function summarizeCoreMetrics(value: unknown) {
  return toArray(value).map((item) => {
    const record = toRecord(item);
    return stringify(record.description ?? `${stringify(record.metric_name ?? record.name)}${stringify(record.value)}`);
  }).filter(Boolean).join("；");
}

function toArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function toStringArray(value: unknown): string[] {
  return toArray(value).map(stringify).filter(Boolean);
}

function toRecord(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
