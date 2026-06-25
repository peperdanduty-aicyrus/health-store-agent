import type { SurveyReportType } from "../survey/types";

type PrimitiveRule = "array" | "number" | "object" | "string";

const reportRules: Record<SurveyReportType, Record<string, PrimitiveRule>> = {
  full_analysis: {
    category_analysis: "array",
    data_limitations: "array",
    decline_reason_summary: "string",
    education_analysis: "string",
    efficiency_analysis: "string",
    executive_summary: "string",
    follow_up_analysis: "string",
    growth_reason_summary: "string",
    kids_entertainment_analysis: "string",
    next_month_plan: "array",
    overall_analysis: "object",
    peer_benchmark_summary: "string",
    warning_store_analysis: "array",
  },
  leadership_brief: {
    data_limitations: "array",
    focus_stores: "array",
    highlights: "array",
    next_month_priorities: "array",
    one_sentence_conclusion: "string",
    overall_performance_summary: "string",
    risks: "array",
  },
  oral_briefing: {
    estimated_minutes: "number",
    key_numbers: "array",
    script: "string",
    speaker_notes: "array",
    title: "string",
  },
  store_analysis: {
    key_evidence: "array",
    merchant_reason_summary: "string",
    next_review_focus: "array",
    operator_issue_judgement: "string",
    priority_actions: "array",
    status: "string",
    store_id: "string",
    warning_flags: "array",
  },
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
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return { errors: ["/ should be object"], valid: false };
  }
  const record = content as Record<string, unknown>;
  const errors: string[] = [];
  for (const [key, rule] of Object.entries(reportRules[reportType])) {
    if (!(key in record)) {
      errors.push(`/${key} is required`);
      continue;
    }
    if (!matchesRule(record[key], rule)) {
      errors.push(`/${key} should be ${rule}`);
    }
  }
  return { errors, valid: errors.length === 0 };
}

function matchesRule(value: unknown, rule: PrimitiveRule) {
  if (rule === "array") return Array.isArray(value);
  if (rule === "number") return typeof value === "number" && Number.isFinite(value);
  if (rule === "object") return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  return typeof value === "string";
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
