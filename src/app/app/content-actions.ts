"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { generateContentDraft } from "@/lib/content/production";
import { assertOrganizationAccess } from "@/lib/ops/access";
import { getOpsStore } from "@/lib/ops/repository";
import { opsContentTypes, type OpsContentType } from "@/lib/ops/types";

function text(formData: FormData, key: string) { return String(formData.get(key) || "").trim(); }
async function assertAssigned(organizationId: string, userId: string) { const store = await getOpsStore(); assertOrganizationAccess(await store.listAssignments(userId), userId, organizationId); return store; }

export async function createOperatorContent(formData: FormData) {
  const profile = await requireUser(); const organizationId = text(formData, "organizationId"); const store = await assertAssigned(organizationId, profile.id);
  const organization = await store.getOrganization(organizationId); const client = organization ? await store.getClient(organization.clientId) : null;
  const contentType = text(formData, "contentType") as OpsContentType;
  if (!organization || !client || !opsContentTypes.includes(contentType)) throw new Error("内容任务参数无效。");
  const task = await store.saveContentTask({ clientId: client.id, organizationId, contentType, titleDirection: text(formData, "titleDirection"), topic: text(formData, "topic") || "基于机构真实资料的内容", targetAudience: text(formData, "targetAudience"), primaryKeyword: text(formData, "primaryKeyword"), secondaryKeywords: "", plannedGenerationDate: "", plannedPublishDate: "", status: "生成中", assignedUserId: profile.id, notes: "", generationCount: 0 });
  const result = await generateContentDraft({ client, profile: await store.getContentProfile(organizationId), task, styleSamples: await store.listStyleSamples(organizationId) });
  if (!result.ok) {
    await store.saveContentGenerationRun({ contentTaskId: task.id, draftId: "", requestId: result.requestId, scene: contentType, promptVersion: "content-center-phase2a-v1", model: result.model, status: "failed", errorCode: result.errorCode, errorMessage: result.errorMessage, elapsedMs: result.elapsedMs, tokenUsage: result.tokenUsage });
    await store.saveContentTask({ ...task, status: "待生成" }); revalidatePath("/app"); return;
  }
  const draft = await store.saveContentDraft({ contentTaskId: task.id, clientId: client.id, organizationId, contentType, ...result.draft, status: "草稿", internalNotes: "", createdByUserId: profile.id, updatedByUserId: profile.id });
  await store.saveContentVersion({ draftId: draft.id, versionNumber: 1, title: draft.title, body: draft.body, changeNote: "首次生成", changedByUserId: profile.id });
  await store.saveContentGenerationRun({ contentTaskId: task.id, draftId: draft.id, requestId: result.requestId, scene: contentType, promptVersion: "content-center-phase2a-v1", model: result.model, status: "success", errorCode: "", errorMessage: "", elapsedMs: result.elapsedMs, tokenUsage: result.tokenUsage });
  await store.saveContentTask({ ...task, status: "待处理", generationCount: 1 }); revalidatePath("/app");
}

export async function saveOperatorContentDraft(formData: FormData) {
  const profile = await requireUser(); const store = await getOpsStore(); const draft = await store.getContentDraft(text(formData, "id"));
  if (!draft) throw new Error("草稿不存在。"); await assertAssigned(draft.organizationId, profile.id);
  await store.saveContentDraft({ ...draft, title: text(formData, "title"), summary: text(formData, "summary"), body: text(formData, "body"), faq: text(formData, "faq"), internalNotes: draft.internalNotes, updatedByUserId: profile.id }); revalidatePath("/app");
}
