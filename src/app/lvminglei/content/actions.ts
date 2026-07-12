"use server";

import { revalidatePath } from "next/cache";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { generateContentDraft } from "@/lib/content/production";
import { getOpsStore } from "@/lib/ops/repository";
import { opsContentTaskStatuses, opsContentTypes, type OpsContentTaskStatus, type OpsContentType } from "@/lib/ops/types";

const contentPaths = ["/lvminglei/content", "/lvminglei", "/lvminglei/calendar", "/app"];
function text(formData: FormData, key: string) { return String(formData.get(key) || "").trim(); }
function refresh() { contentPaths.forEach((path) => revalidatePath(path)); }

export async function saveContentTask(formData: FormData) {
  await requireWorkbenchOwner(); const store = await getOpsStore();
  const organizationId = text(formData, "organizationId"); const organization = await store.getOrganization(organizationId);
  if (!organization) throw new Error("机构不存在。");
  const value = text(formData, "contentType") as OpsContentType;
  if (!opsContentTypes.includes(value)) throw new Error("内容类型无效。");
  const requested = text(formData, "status") as OpsContentTaskStatus;
  const existing = text(formData, "id") ? await store.getContentTask(text(formData, "id")) : null;
  const saved = await store.saveContentTask({
    id: existing?.id, clientId: organization.clientId, organizationId, contentType: value,
    titleDirection: text(formData, "titleDirection"), topic: text(formData, "topic"), targetAudience: text(formData, "targetAudience"),
    primaryKeyword: text(formData, "primaryKeyword"), secondaryKeywords: text(formData, "secondaryKeywords"),
    plannedGenerationDate: text(formData, "plannedGenerationDate"), plannedPublishDate: text(formData, "plannedPublishDate"),
    generationCount: existing?.generationCount ?? 0, status: opsContentTaskStatuses.includes(requested) ? requested : existing?.status || "待生成",
    assignedUserId: text(formData, "assignedUserId"), notes: text(formData, "notes"),
  });
  void saved;
  refresh();
}

export async function generateContentTask(formData: FormData) {
  const account = await requireWorkbenchOwner(); await generateTask(text(formData, "taskId"), account.id); refresh();
}

export async function batchGenerateContentTasks(formData: FormData) {
  const account = await requireWorkbenchOwner();
  if (text(formData, "confirmed") !== "yes") throw new Error("请先确认生成范围。");
  const ids = Array.from(new Set(text(formData, "taskIds").split(",").filter(Boolean))).slice(0, 20);
  // Deliberately independent: a failure writes its own safe run and never rolls back prior successes.
  for (const id of ids) await generateTask(id, account.id);
  refresh();
}

export async function saveContentDraft(formData: FormData) {
  const account = await requireWorkbenchOwner(); const store = await getOpsStore(); const id = text(formData, "id"); const current = id ? await store.getContentDraft(id) : null;
  if (!current) throw new Error("草稿不存在。");
  const versions = await store.listContentVersions(id);
  await store.saveContentVersion({ draftId: id, versionNumber: (versions[0]?.versionNumber || 0) + 1, title: current.title, body: current.body, changeNote: text(formData, "changeNote") || "手工编辑前存档", changedByUserId: account.id });
  await store.saveContentDraft({ ...current, title: text(formData, "title"), summary: text(formData, "summary"), body: text(formData, "body"), faq: text(formData, "faq"), seoTitle: text(formData, "seoTitle"), seoDescription: text(formData, "seoDescription"), suggestedKeywords: text(formData, "suggestedKeywords"), status: (text(formData, "status") || current.status) as typeof current.status, internalNotes: text(formData, "internalNotes"), updatedByUserId: account.id });
  refresh();
}

export async function restoreContentVersion(formData: FormData) {
  const account = await requireWorkbenchOwner(); const store = await getOpsStore(); const draft = await store.getContentDraft(text(formData, "draftId"));
  const version = (await store.listContentVersions(text(formData, "draftId"))).find((item) => item.id === text(formData, "versionId"));
  if (!draft || !version) throw new Error("版本不存在。");
  await store.saveContentDraft({ ...draft, title: version.title, body: version.body, updatedByUserId: account.id }); refresh();
}

export async function saveStyleSample(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const organizationId = text(formData, "organizationId");
  if (!await store.getOrganization(organizationId)) throw new Error("机构不存在。");
  const contentType = text(formData, "contentType") as OpsContentType;
  if (!opsContentTypes.includes(contentType)) throw new Error("内容类型无效。");
  await store.saveStyleSample({ organizationId, title: text(formData, "title"), content: text(formData, "content"), contentType, active: true });
  refresh();
}

export async function saveContentKeyword(formData: FormData) {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const organizationId = text(formData, "organizationId");
  if (!await store.getOrganization(organizationId)) throw new Error("机构不存在。");
  const keyword = text(formData, "keyword");
  if (!keyword) throw new Error("关键词不能为空。");
  await store.saveKeyword({ organizationId, keyword, keywordType: text(formData, "keywordType") || "核心词", source: "manual", active: true, usageCount: 0, lastUsedAt: "", notes: text(formData, "notes") });
  refresh();
}

async function generateTask(taskId: string, actorId: string) {
  const store = await getOpsStore(); const task = await store.getContentTask(taskId);
  if (!task || task.status === "生成中" || task.status === "已作废") return;
  const organization = await store.getOrganization(task.organizationId); const client = organization ? await store.getClient(organization.clientId) : null;
  if (!organization || !client) throw new Error("内容任务关联的机构资料不存在。");
  await store.saveContentTask({ ...task, status: "生成中" });
  const result = await generateContentDraft({ client, profile: await store.getContentProfile(task.organizationId), task, styleSamples: await store.listStyleSamples(task.organizationId) });
  if (!result.ok) {
    await store.saveContentGenerationRun({ contentTaskId: task.id, draftId: "", requestId: result.requestId, scene: task.contentType, promptVersion: "content-center-phase2a-v1", model: result.model, status: "failed", errorCode: result.errorCode, errorMessage: result.errorMessage, elapsedMs: result.elapsedMs, tokenUsage: result.tokenUsage });
    await store.saveContentTask({ ...task, status: "待生成" }); return;
  }
  const draft = await store.saveContentDraft({ contentTaskId: task.id, clientId: task.clientId, organizationId: task.organizationId, contentType: task.contentType, ...result.draft, status: "草稿", internalNotes: "", createdByUserId: actorId, updatedByUserId: actorId });
  await store.saveContentVersion({ draftId: draft.id, versionNumber: 1, title: draft.title, body: draft.body, changeNote: "首次生成", changedByUserId: actorId });
  await store.saveContentGenerationRun({ contentTaskId: task.id, draftId: draft.id, requestId: result.requestId, scene: task.contentType, promptVersion: "content-center-phase2a-v1", model: result.model, status: "success", errorCode: "", errorMessage: "", elapsedMs: result.elapsedMs, tokenUsage: result.tokenUsage });
  await store.saveContentTask({ ...task, status: "待处理", generationCount: task.generationCount + 1 });
}
