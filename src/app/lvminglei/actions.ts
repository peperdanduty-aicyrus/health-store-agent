"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { workbenchSessionCookieName, requireWorkbenchAccount, requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getDataStore } from "@/lib/data/repository";
import type { WorkbenchGenerationType } from "@/lib/data/types";
import { workbenchToolDefinitions } from "@/lib/domain/workbench";
import { generateWorkbenchPreview } from "@/lib/workbench/generation";
import { monthRange, currentChinaMonth, weekRange } from "@/lib/ops/date";
import { getOpsStore } from "@/lib/ops/repository";
import { buildOpsReportDraft } from "@/lib/ops/report-draft";
import { opsReportTypes, opsTaskStatuses, type OpsReportType, type OpsTaskStatus } from "@/lib/ops/types";

export type WorkbenchLoginState = {
  message: string;
};

export type WorkbenchActionState = {
  message: string;
  success: boolean;
};

export type WorkbenchGenerationState = WorkbenchActionState & {
  generationId?: string;
  inputSummary?: Record<string, string>;
  result?: string;
};

const initialWorkbenchPath = "/lvminglei";

export async function loginWorkbench(
  _previousState: WorkbenchLoginState,
  formData: FormData,
): Promise<WorkbenchLoginState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const store = await getDataStore();
  const account = await store.loginWorkbenchAccount(phone, password);

  if (!account) {
    return { message: "账号或密码不正确，或账号已被禁用。" };
  }

  const cookieStore = await cookies();
  cookieStore.set(workbenchSessionCookieName, account.id, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  redirect(initialWorkbenchPath);
}

export async function logoutWorkbench() {
  const cookieStore = await cookies();
  cookieStore.delete(workbenchSessionCookieName);
  redirect(initialWorkbenchPath);
}

export async function createWorkbenchSubaccount(
  _previousState: WorkbenchActionState,
  formData: FormData,
): Promise<WorkbenchActionState> {
  await requireWorkbenchOwner();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!phone || !password || !displayName) {
    return { message: "请填写账号、密码和名称。", success: false };
  }
  if (password.length < 6) {
    return { message: "密码至少 6 位。", success: false };
  }

  const store = await getDataStore();
  const existing = (await store.listWorkbenchAccounts()).find((account) => account.phone === phone);
  if (existing) {
    return { message: "该账号已存在。", success: false };
  }

  await store.createWorkbenchAccount({
    disabled: false,
    displayName,
    note,
    password,
    phone,
    role: "subaccount",
  });
  revalidatePath("/lvminglei/accounts");

  return { message: "子账号已创建。", success: true };
}

export async function toggleWorkbenchSubaccount(
  _previousState: WorkbenchActionState,
  formData: FormData,
): Promise<WorkbenchActionState> {
  await requireWorkbenchOwner();
  const accountId = String(formData.get("accountId") || "");
  const disabled = String(formData.get("disabled") || "") === "true";
  const updated = await (await getDataStore()).updateWorkbenchAccountDisabled(accountId, disabled);

  if (!updated || updated.role !== "subaccount") {
    return { message: "未找到可操作的子账号。", success: false };
  }

  revalidatePath("/lvminglei/accounts");
  return { message: disabled ? "子账号已禁用。" : "子账号已启用。", success: true };
}

export async function resetWorkbenchSubaccountPassword(
  _previousState: WorkbenchActionState,
  formData: FormData,
): Promise<WorkbenchActionState> {
  await requireWorkbenchOwner();
  const accountId = String(formData.get("accountId") || "");
  const password = String(formData.get("password") || "");

  if (password.length < 6) {
    return { message: "新密码至少 6 位。", success: false };
  }

  const store = await getDataStore();
  const account = await store.getWorkbenchAccountById(accountId);
  if (!account || account.role !== "subaccount") {
    return { message: "未找到子账号。", success: false };
  }

  await store.updateWorkbenchAccountPassword(accountId, password);
  revalidatePath("/lvminglei/accounts");
  return { message: "子账号密码已重置。", success: true };
}

export async function generateWorkbench(
  _previousState: WorkbenchGenerationState,
  formData: FormData,
): Promise<WorkbenchGenerationState> {
  const account = await requireWorkbenchAccount();
  const type = String(formData.get("type") || "") as WorkbenchGenerationType;

  if (!workbenchToolDefinitions[type]) {
    return { message: "未知的生成工具。", success: false };
  }

  const input = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => key !== "type")
      .map(([key, value]) => [key, String(value || "").trim()]),
  ) as Record<string, string>;

  const preview = await generateWorkbenchPreview(type, input);
  const record = await (await getDataStore()).createWorkbenchGeneration({
    accountDisplayName: account.displayName,
    accountId: account.id,
    accountPhone: account.phone,
    copied: false,
    generationType: type,
    input: JSON.stringify(input),
    modelName: preview.model,
    modelProvider: preview.provider,
    output: preview.result,
    prompt: preview.prompt,
  });

  revalidatePath("/lvminglei/history");
  return {
    generationId: record.id,
    inputSummary: preview.inputSummary,
    message: preview.message === "已生成。" ? "已生成，并保存到历史记录。" : preview.message,
    result: record.output,
    success: true,
  };
}

export async function markWorkbenchCopied(generationId: string): Promise<void> {
  const account = await requireWorkbenchAccount();
  const store = await getDataStore();
  const record = await store.getWorkbenchGenerationById(generationId);
  if (!record) {
    return;
  }
  if (account.role !== "owner" && record.accountId !== account.id) {
    return;
  }

  await store.markWorkbenchGenerationCopied(generationId);
  revalidatePath("/lvminglei/history");
}

export async function deleteWorkbenchGeneration(formData: FormData): Promise<void> {
  const account = await requireWorkbenchAccount();
  const generationId = String(formData.get("generationId") || "");
  const store = await getDataStore();
  const record = await store.getWorkbenchGenerationById(generationId);

  if (!record) {
    return;
  }
  if (account.role !== "owner" && record.accountId !== account.id) {
    return;
  }

  await store.deleteWorkbenchGeneration(generationId);
  revalidatePath("/lvminglei/history");
}

export async function saveOpsClient(formData: FormData) {
  await requireWorkbenchOwner();
  const clientName = textValue(formData, "clientName");
  if (!clientName) throw new Error("客户名称不能为空。");
  const id = textValue(formData, "id");
  const store = await getOpsStore();
  const existing = id ? await store.getClient(id) : null;
  const saved = await store.saveClient({
    id: id || undefined,
    clientName,
    brandName: textValue(formData, "brandName"),
    industry: textValue(formData, "industry"),
    city: textValue(formData, "city"),
    serviceArea: textValue(formData, "serviceArea"),
    contactName: textValue(formData, "contactName"),
    contactMethod: textValue(formData, "contactMethod"),
    address: textValue(formData, "address"),
    companyIntro: textValue(formData, "companyIntro"),
    mainBusiness: textValue(formData, "mainBusiness"),
    targetAudience: textValue(formData, "targetAudience"),
    businessHours: textValue(formData, "businessHours"),
    customerSource: textValue(formData, "customerSource"),
    cooperationStatus: textValue(formData, "cooperationStatus") || "合作中",
    notes: textValue(formData, "notes"),
    active: existing?.active ?? true,
  });
  revalidateOpsPaths(saved.id);
  redirect(`/lvminglei/clients/${saved.id}`);
}

export async function setOpsClientActive(formData: FormData) {
  await requireWorkbenchOwner();
  const id = textValue(formData, "id");
  await (await getOpsStore()).setClientActive(id, textValue(formData, "active") === "true");
  revalidateOpsPaths(id);
}

export async function saveOpsOrganization(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const id = textValue(formData, "id");
  const existing = id ? await store.getOrganization(id) : null;
  const saved = await store.saveOrganization({
    id: id || undefined,
    clientId: textValue(formData, "clientId"),
    organizationName: textValue(formData, "organizationName"),
    organizationType: textValue(formData, "organizationType"),
    description: textValue(formData, "description"),
    active: existing?.active ?? true,
  });
  revalidateOpsPaths(saved.clientId);
}

export async function setOpsOrganizationActive(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const id = textValue(formData, "id");
  const organization = await store.setOrganizationActive(id, textValue(formData, "active") === "true");
  revalidateOpsPaths(organization?.clientId);
}

export async function saveOpsTask(formData: FormData) {
  await requireWorkbenchOwner();
  const statusValue = textValue(formData, "status");
  const status: OpsTaskStatus = opsTaskStatuses.includes(statusValue as OpsTaskStatus)
    ? (statusValue as OpsTaskStatus)
    : "待处理";
  const store = await getOpsStore();
  const id = textValue(formData, "id");
  const existing = id ? await store.getTask(id) : null;
  const saved = await store.saveTask({
    id: id || undefined,
    clientId: textValue(formData, "clientId"),
    organizationId: textValue(formData, "organizationId"),
    title: textValue(formData, "title"),
    taskType: textValue(formData, "taskType") || "临时待办",
    description: textValue(formData, "description"),
    scheduledDate: textValue(formData, "scheduledDate"),
    dueDate: textValue(formData, "dueDate"),
    status,
    priority: textValue(formData, "priority") || "普通",
    assignedUserId: textValue(formData, "assignedUserId"),
    relatedPlatform: textValue(formData, "relatedPlatform"),
    keyword: textValue(formData, "keyword"),
    completedAt: ["已完成", "已交付", "已发布"].includes(status)
      ? existing?.completedAt || new Date().toISOString()
      : "",
  });
  revalidateOpsPaths(saved.clientId);
}

export async function deleteOpsTask(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const id = textValue(formData, "id");
  const task = await store.getTask(id);
  await store.deleteTask(id);
  revalidateOpsPaths(task?.clientId);
}

export async function saveOpsTaskLog(formData: FormData) {
  const account = await requireWorkbenchOwner();
  const saved = await (await getOpsStore()).saveTaskLog({
    id: undefined,
    taskId: textValue(formData, "taskId"),
    clientId: textValue(formData, "clientId"),
    organizationId: textValue(formData, "organizationId"),
    logType: textValue(formData, "logType") || "工作记录",
    content: textValue(formData, "content"),
    nextAction: textValue(formData, "nextAction"),
    createdByUserId: account.id,
  });
  revalidateOpsPaths(saved.clientId);
}

export async function saveOpsAgreement(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const clientId = textValue(formData, "clientId");
  const existing = (await store.listAgreements(clientId))[0];
  await store.saveAgreement({
    id: existing?.id,
    clientId,
    serviceStartDate: textValue(formData, "serviceStartDate"),
    serviceEndDate: textValue(formData, "serviceEndDate"),
    monthlyFee: numberValue(formData, "monthlyFee"),
    settlementDay: numberValue(formData, "settlementDay") || 1,
    expectedAmount: numberValue(formData, "expectedAmount"),
    paidAmount: numberValue(formData, "paidAmount"),
    paymentStatus: textValue(formData, "paymentStatus") || "待收款",
    deliveryMethod: textValue(formData, "deliveryMethod"),
    serviceScope: textValue(formData, "serviceScope"),
    monthlyTasks: textValue(formData, "monthlyTasks"),
    weeklyTasks: textValue(formData, "weeklyTasks"),
    importantAgreements: textValue(formData, "importantAgreements"),
    renewalProbability: textValue(formData, "renewalProbability"),
  });
  revalidateOpsPaths(clientId);
}

export async function saveOpsPayment(formData: FormData) {
  await requireWorkbenchOwner();
  const clientId = textValue(formData, "clientId");
  await (await getOpsStore()).savePayment({
    id: textValue(formData, "id") || undefined,
    clientId,
    billingMonth: textValue(formData, "billingMonth") || currentChinaMonth(),
    expectedAmount: numberValue(formData, "expectedAmount"),
    receivedAmount: numberValue(formData, "receivedAmount"),
    dueDate: textValue(formData, "dueDate"),
    receivedDate: textValue(formData, "receivedDate"),
    status: textValue(formData, "status") || "待收款",
    notes: textValue(formData, "notes"),
  });
  revalidateOpsPaths(clientId);
}

export async function saveOpsSubscription(formData: FormData) {
  await requireWorkbenchOwner();
  await (await getOpsStore()).saveSubscription({
    id: textValue(formData, "id") || undefined,
    serviceName: textValue(formData, "serviceName"),
    accountNote: textValue(formData, "accountNote"),
    purchaseDate: textValue(formData, "purchaseDate"),
    expiryDate: textValue(formData, "expiryDate"),
    price: numberValue(formData, "price"),
    billingCycle: textValue(formData, "billingCycle"),
    autoRenew: formData.get("autoRenew") === "on",
    usageNote: textValue(formData, "usageNote"),
    status: textValue(formData, "status") || "使用中",
    notes: textValue(formData, "notes"),
  });
  revalidatePath("/lvminglei");
  revalidatePath("/lvminglei/calendar");
  revalidatePath("/lvminglei/subscriptions");
}

export async function renewOpsSubscription(formData: FormData) {
  await requireWorkbenchOwner();
  await (await getOpsStore()).renewSubscription(textValue(formData, "id"), textValue(formData, "expiryDate"));
  revalidatePath("/lvminglei");
  revalidatePath("/lvminglei/calendar");
  revalidatePath("/lvminglei/subscriptions");
}

export async function generateOpsReport(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const clientId = textValue(formData, "clientId");
  const organizationId = textValue(formData, "organizationId");
  const rawType = textValue(formData, "reportType") as OpsReportType;
  const reportType = opsReportTypes.includes(rawType) ? rawType : "weekly";
  const period = reportType === "weekly" ? weekRange() : monthRange(currentChinaMonth());
  const [tasks, logs] = await Promise.all([
    store.listTasks({ clientId, organizationId: organizationId || undefined, periodStart: period.start, periodEnd: period.end }),
    store.listTaskLogs(clientId, organizationId || undefined),
  ]);
  const report = await store.saveReport({
    id: undefined,
    clientId,
    organizationId,
    reportType,
    periodStart: period.start,
    periodEnd: period.end,
    content: buildOpsReportDraft(reportType, tasks, logs.filter((log) => log.createdAt.slice(0, 10) >= period.start && log.createdAt.slice(0, 10) <= period.end)),
    status: "草稿",
  });
  revalidateOpsPaths(clientId);
  redirect(`/lvminglei/reports/${report.id}`);
}

export async function saveOpsReport(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const id = textValue(formData, "id");
  const existing = await store.getReport(id);
  if (!existing) throw new Error("汇报草稿不存在。");
  await store.saveReport({ ...existing, content: textValue(formData, "content"), status: textValue(formData, "status") || "草稿" });
  revalidateOpsPaths(existing.clientId);
  revalidatePath(`/lvminglei/reports/${id}`);
}

export async function saveOpsContentProfile(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const organizationId = textValue(formData, "organizationId");
  const existing = await store.getContentProfile(organizationId);
  await store.saveContentProfile({
    id: existing?.id,
    organizationId,
    detailedIntro: textValue(formData, "detailedIntro"),
    services: textValue(formData, "services"),
    realAdvantages: textValue(formData, "realAdvantages"),
    teamInfo: textValue(formData, "teamInfo"),
    qualifications: textValue(formData, "qualifications"),
    faq: textValue(formData, "faq"),
    audienceConcerns: textValue(formData, "audienceConcerns"),
    writingStyle: textValue(formData, "writingStyle"),
    prohibitedClaims: textValue(formData, "prohibitedClaims"),
    bannedWords: textValue(formData, "bannedWords"),
    referenceAccounts: textValue(formData, "referenceAccounts"),
    keywords: textValue(formData, "keywords"),
    usedKeywords: textValue(formData, "usedKeywords"),
  });
  revalidatePath(`/lvminglei/organizations/${organizationId}`);
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function numberValue(formData: FormData, key: string) {
  const value = Number(textValue(formData, key) || "0");
  return Number.isFinite(value) ? value : 0;
}

function revalidateOpsPaths(clientId?: string) {
  for (const path of ["/lvminglei", "/lvminglei/clients", "/lvminglei/organizations", "/lvminglei/tasks", "/lvminglei/calendar", "/lvminglei/revenue"]) {
    revalidatePath(path);
  }
  if (clientId) revalidatePath(`/lvminglei/clients/${clientId}`);
}
