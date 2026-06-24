import type { SurveyReportProvider, SurveyReportProviderResult } from "./report-types";

export function createDeepSeekReportProvider(): SurveyReportProvider {
  return {
    async completeJson({ prompt, timeoutMs }): Promise<SurveyReportProviderResult> {
      return callDeepSeekJson({ prompt, timeoutMs });
    },
  };
}

export async function callDeepSeekJson({ prompt, timeoutMs = Number(process.env.DEEPSEEK_TIMEOUT_MS || 90000) }: { prompt: string; timeoutMs?: number }): Promise<SurveyReportProviderResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY;
  const baseUrl = process.env.DEEPSEEK_API_BASE || process.env.AI_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || process.env.AI_MODEL || "deepseek-v4-flash";
  if (!apiKey) {
    throw classifyAiError("missing_api_key", "DEEPSEEK_API_KEY 或 AI_API_KEY 未配置，无法调用真实DeepSeek。", { model, provider: "deepseek" });
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      body: JSON.stringify({
        messages: [{ content: prompt, role: "user" }],
        model,
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw classifyAiError(response.status === 429 ? "rate_limited" : response.status >= 500 ? "server_error" : "provider_error", `DeepSeek请求失败：HTTP ${response.status}`, {
        model,
        provider: "deepseek",
      });
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: Record<string, unknown>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw classifyAiError("empty_response", "DeepSeek返回空内容。", { model, provider: "deepseek" });
    return { content, elapsedMs: Date.now() - started, model, provider: "deepseek", usage: data.usage ?? null };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw classifyAiError("timeout", "DeepSeek请求超时。", { model, provider: "deepseek" });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function classifyAiError(code: string, message: string, meta?: { model?: string; provider?: string }) {
  const error = new Error(message) as Error & { code: string; model?: string; provider?: string };
  error.code = code;
  error.model = meta?.model;
  error.provider = meta?.provider;
  return error;
}

export function createMockReportProvider(mode: "fail" | "success" = "success"): SurveyReportProvider {
  return {
    async completeJson({ prompt, reportType }): Promise<SurveyReportProviderResult> {
      if (mode === "fail") throw classifyAiError("mock_failure", "Mock DeepSeek失败演示。", { model: "mock-survey-report", provider: "mock" });
      return {
        content: JSON.stringify(buildMockReportContent(reportType, prompt)),
        elapsedMs: 1,
        model: "mock-survey-report",
        provider: "mock",
        usage: null,
      };
    },
  };
}

function buildMockReportContent(reportType: string, prompt = "") {
  const input = extractInput(prompt);
  const overall = input?.overall_metrics ?? {};
  const stores = Array.isArray(input?.stores) ? input.stores : [];
  const categories = Array.isArray(input?.category_metrics) ? input.category_metrics : [];
  const firstStore =
    stores.find((item: any) => (item.warning_flags ?? []).length && readValue(item.metrics, "effective_sales_wan", "effectiveSalesWan") !== null) ??
    stores.find((item: any) => readValue(item.metrics, "effective_sales_wan", "effectiveSalesWan") !== null) ??
    stores[0] ??
    { store_id: "STORE_001", warning_flags: [] };
  const sales = formatNullable(readValue(overall, "sales_wan", "salesWan"), "万元");
  const target = formatRate(readValue(overall, "target_completion_rate", "targetCompletionRate"));
  const warningCount = readValue(overall, "warning_count", "warningCount") ?? 0;
  const criticalStoreCount = readValue(overall, "critical_store_count", "criticalStoreCount") ?? 0;
  if (reportType === "full_analysis") {
    return {
      category_analysis: categories.map((item: any) => ({
        action: "按系统预警和跟进记录继续复盘。",
        assessment: `${item.category}销售${formatNullable(readValue(item, "sales_wan", "salesWan"), "万元")}，目标完成率${formatRate(readValue(item, "target_completion_rate", "targetCompletionRate"))}。`,
        category: item.category,
        evidence: `销售${formatNullable(readValue(item, "sales_wan", "salesWan"), "万元")}，增长门店${readValue(item, "up_store_count", "upStoreCount") ?? 0}家，下降门店${readValue(item, "down_store_count", "downStoreCount") ?? 0}家。`,
        risk: (readValue(item, "down_store_count", "downStoreCount") ?? 0) > 0 ? "存在下降门店，需结合预警逐店跟进。" : "暂无集中风险。",
      })),
      data_limitations: ["同比、环比或专项字段缺失时显示暂无数据或待数据积累。"],
      decline_reason_summary: "暂无数据",
      education_analysis: "暂无数据",
      efficiency_analysis: "坪效、人效直接引用系统确定性结果，缺失门店不按0参与判断。",
      executive_summary: `本月整体销售${sales}，目标完成率${target}，预警${warningCount}项。`,
      follow_up_analysis: "待营运继续跟进。",
      growth_reason_summary: "暂无数据",
      kids_entertainment_analysis: "暂无数据",
      next_month_plan: [{ action: "复查重点门店", check_point: "下次跟进日期", direction: "营运跟进", priority: 1, scope: "预警门店" }],
      overall_analysis: { data_source_note: "POS优先，缺失不按0。", target: `整体目标完成率${target}。`, trend: "暂无数据" },
      peer_benchmark_summary: "同城对标仅作为参考数据。",
      warning_store_analysis: stores.filter((item: any) => (item.warning_flags ?? []).length).slice(0, 5).map((item: any) => ({
        evidence: `有效销售${formatNullable(readValue(item.metrics, "effective_sales_wan", "effectiveSalesWan"), "万元")}，目标完成率${formatRate(readValue(item.metrics, "target_completion_rate", "targetCompletionRate"))}。`,
        issue: "存在系统预警，需营运复核。",
        priority_action: "结合商户反馈和跟进记录复查。",
        store_id: item.store_id,
        warnings: item.warning_flags ?? [],
      })),
    };
  }
  if (reportType === "oral_briefing") {
    return { estimated_minutes: 4, key_numbers: [`整体销售${sales}`, `目标完成率${target}`], script: `各位领导，下面汇报本月商户经营情况。本月整体销售${sales}，目标完成率${target}。所有数字均来自系统已计算结果，缺失数据统一按暂无数据处理。下月重点是复查预警门店、补齐缺失数据，并推动跟进记录闭环。`, speaker_notes: ["不补造缺失数据", "同城对标仅作为参考"], title: "月度经营口头汇报" };
  }
  if (reportType === "store_analysis") {
    return { key_evidence: [`有效销售${formatNullable(readValue(firstStore.metrics, "effective_sales_wan", "effectiveSalesWan"), "万元")}`, `目标完成率${formatRate(readValue(firstStore.metrics, "target_completion_rate", "targetCompletionRate"))}`], merchant_reason_summary: readValue(firstStore.merchant_input, "self_rating", "selfRating") || "暂无数据", next_review_focus: ["复查整改进展"], operator_issue_judgement: "需继续跟进", priority_actions: ["补充跟进记录"], status: "待复查", store_id: firstStore.store_id, warning_flags: firstStore.warning_flags ?? [] };
  }
  return {
    data_limitations: ["Mock演示初稿；真实报告以DeepSeek任务状态为准。"],
    focus_stores: stores.filter((item: any) => (item.warning_flags ?? []).length).slice(0, 5).map((item: any) => ({
      evidence: `有效销售${formatNullable(readValue(item.metrics, "effective_sales_wan", "effectiveSalesWan"), "万元")}，目标完成率${formatRate(readValue(item.metrics, "target_completion_rate", "targetCompletionRate"))}。`,
      follow_up_focus: "复查预警和整改进度",
      issue: "存在系统预警",
      store_id: item.store_id,
    })),
    highlights: categories.slice(0, 3).map((item: any) => ({ evidence: `销售${formatNullable(readValue(item, "sales_wan", "salesWan"), "万元")}`, interpretation: "按系统确定性数据展示。", title: item.category })),
    next_month_priorities: ["跟进预警门店", "复查POS差异", "补齐缺失数据"],
    one_sentence_conclusion: `本月整体销售${sales}，目标完成率${target}，需关注${criticalStoreCount}家重点门店。`,
    overall_performance_summary: `销售额、环比、同比、目标完成率、坪效、人效和预警均来自第四阶段计算结果；当前预警${warningCount}项。`,
    risks: stores.filter((item: any) => (item.warning_flags ?? []).length).slice(0, 3).map((item: any) => ({ action: "安排营运跟进", evidence: (item.warning_flags ?? []).join("、"), scope: item.store_id, type: "系统预警" })),
  };
}

function readValue(source: any, snakeKey: string, camelKey: string) {
  if (!source) return undefined;
  return source[snakeKey] ?? source[camelKey];
}

function extractInput(prompt: string): any {
  const marker = "输入 JSON：";
  const index = prompt.indexOf(marker);
  if (index < 0) return null;
  try {
    return JSON.parse(prompt.slice(index + marker.length).trim());
  } catch {
    return null;
  }
}

function formatNullable(value: unknown, suffix = "") {
  return value === null || value === undefined || value === "" ? "暂无数据" : `${value}${suffix}`;
}

function formatRate(value: unknown) {
  if (value === null || value === undefined || value === "") return "暂无数据";
  return `${Math.round(Number(value) * 1000) / 10}%`;
}
