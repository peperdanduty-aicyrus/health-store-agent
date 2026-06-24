"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMockReportProvider } from "@/lib/ai/deepseek";
import { generateSurveyReport } from "@/lib/ai/report-service";
import { getSurveyStore } from "@/lib/survey/repository";
import { requireSurveyStaff } from "@/lib/survey/session";
import type { SurveyReportType } from "@/lib/survey/types";

export async function generateSurveyAiReport(formData: FormData): Promise<void> {
  const staff = await requireActiveOperator();
  const store = await getSurveyStore();
  await store.ensureSurveyDemoStores();
  const provider = readProviderMode(formData);
  const result = await generateSurveyReport({
    actorId: staff.id,
    mallId: staff.mallId,
    periodMonth: String(formData.get("periodMonth") || "2026-05"),
    provider,
    reportType: readReportType(formData),
    store,
  });
  revalidatePath("/yingyun/reports");
  if (result.reportId) redirect(`/yingyun/reports/${result.reportId}`);
}

export async function retrySurveyAiReport(formData: FormData): Promise<void> {
  if (!isMockProviderAllowed()) {
    throw new Error("当前环境不允许使用Mock Provider重试。");
  }
  const staff = await requireActiveOperator();
  const store = await getSurveyStore();
  await store.ensureSurveyDemoStores();
  const result = await generateSurveyReport({
    actorId: staff.id,
    mallId: staff.mallId,
    periodMonth: String(formData.get("periodMonth") || "2026-05"),
    provider: createMockReportProvider("success"),
    reportType: readReportType(formData),
    store,
  });
  revalidatePath("/yingyun/reports");
  if (result.reportId) redirect(`/yingyun/reports/${result.reportId}`);
}

export async function saveSurveyReportManualVersion(formData: FormData): Promise<void> {
  const staff = await requireActiveOperator();
  const store = await getSurveyStore();
  const reportId = String(formData.get("reportId") || "");
  const title = String(formData.get("title") || "").trim() || "人工编辑版本";
  const contentJson = String(formData.get("contentJson") || "{}");
  await store.createSurveyReportVersion({
    actorId: staff.id,
    contentJson,
    reportId,
    title,
    versionKind: "manual_edit",
    versionNote: String(formData.get("versionNote") || "人工编辑"),
  });
  revalidatePath(`/yingyun/reports/${reportId}`);
}

export async function confirmSurveyReportVersion(formData: FormData): Promise<void> {
  const staff = await requireActiveOperator();
  const reportId = String(formData.get("reportId") || "");
  const versionId = String(formData.get("versionId") || "");
  await (await getSurveyStore()).confirmSurveyReportVersion({ actorId: staff.id, reportId, versionId });
  revalidatePath(`/yingyun/reports/${reportId}`);
  revalidatePath("/yingyun/reports");
}

export async function markSurveyReportCurrentVersion(formData: FormData): Promise<void> {
  const staff = await requireActiveOperator();
  const reportId = String(formData.get("reportId") || "");
  const versionId = String(formData.get("versionId") || "");
  await (await getSurveyStore()).setSurveyReportCurrentVersion({ actorId: staff.id, reportId, versionId });
  revalidatePath(`/yingyun/reports/${reportId}`);
  revalidatePath("/yingyun/reports");
}

async function requireActiveOperator() {
  const staff = await requireSurveyStaff();
  const today = new Date().toISOString();
  if (staff.role !== "operator" || !staff.enabled || staff.expiresAt < today) {
    throw new Error("无权限或营运账号已过期，不能生成或导出AI报告。");
  }
  return staff;
}

function readReportType(formData: FormData): SurveyReportType {
  const value = String(formData.get("reportType") || "leadership_brief");
  return value === "full_analysis" || value === "oral_briefing" || value === "store_analysis" ? value : "leadership_brief";
}

function readProviderMode(formData: FormData) {
  const mode = String(formData.get("providerMode") || "auto");
  if (!isMockProviderAllowed()) return undefined;
  if (mode === "mock") return createMockReportProvider("success");
  if (mode === "mock_fail") return createMockReportProvider("fail");
  return undefined;
}

export async function isSurveyReportMockProviderAllowed() {
  return isMockProviderAllowed();
}

function isMockProviderAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.SURVEY_REPORT_MOCK_PROVIDER_ENABLED === "1";
}
