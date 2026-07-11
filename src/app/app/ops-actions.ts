"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { assertOrganizationAccess } from "@/lib/ops/access";
import { getOpsStore } from "@/lib/ops/repository";
import { opsTaskStatuses, type OpsTaskStatus } from "@/lib/ops/types";

export async function updateAssignedTask(formData: FormData) {
  const profile = await requireUser();
  const store = await getOpsStore();
  const taskId = text(formData, "taskId");
  const task = await store.getTask(taskId);
  if (!task) throw new Error("任务不存在。");
  assertOrganizationAccess(await store.listAssignments(profile.id), profile.id, task.organizationId);
  const requestedStatus = text(formData, "status") as OpsTaskStatus;
  const status = opsTaskStatuses.includes(requestedStatus) ? requestedStatus : task.status;
  await store.saveTask({
    ...task,
    status,
    description: text(formData, "description") || task.description,
    scheduledDate: text(formData, "scheduledDate") || task.scheduledDate,
    dueDate: text(formData, "dueDate") || task.dueDate,
    completedAt: ["已完成", "已交付", "已发布"].includes(status)
      ? task.completedAt || new Date().toISOString()
      : "",
  });
  revalidatePath("/app");
}

export async function addAssignedTaskLog(formData: FormData) {
  const profile = await requireUser();
  const store = await getOpsStore();
  const organizationId = text(formData, "organizationId");
  assertOrganizationAccess(await store.listAssignments(profile.id), profile.id, organizationId);
  await store.saveTaskLog({
    id: undefined,
    taskId: text(formData, "taskId"),
    clientId: text(formData, "clientId"),
    organizationId,
    logType: text(formData, "logType") || "工作记录",
    content: text(formData, "content"),
    nextAction: text(formData, "nextAction"),
    createdByUserId: profile.id,
  });
  revalidatePath("/app");
}

export async function saveAssignedContentProfile(formData: FormData) {
  const profile = await requireUser();
  const store = await getOpsStore();
  const organizationId = text(formData, "organizationId");
  assertOrganizationAccess(await store.listAssignments(profile.id), profile.id, organizationId);
  const existing = await store.getContentProfile(organizationId);
  await store.saveContentProfile({
    id: existing?.id,
    organizationId,
    detailedIntro: text(formData, "detailedIntro"),
    services: text(formData, "services"),
    realAdvantages: text(formData, "realAdvantages"),
    teamInfo: text(formData, "teamInfo"),
    qualifications: text(formData, "qualifications"),
    faq: text(formData, "faq"),
    audienceConcerns: text(formData, "audienceConcerns"),
    writingStyle: text(formData, "writingStyle"),
    prohibitedClaims: text(formData, "prohibitedClaims"),
    bannedWords: text(formData, "bannedWords"),
    referenceAccounts: text(formData, "referenceAccounts"),
    keywords: text(formData, "keywords"),
    usedKeywords: text(formData, "usedKeywords"),
  });
  revalidatePath("/app");
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}
