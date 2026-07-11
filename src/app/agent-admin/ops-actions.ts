"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getOpsStore } from "@/lib/ops/repository";
import { getDataStore } from "@/lib/data/repository";

export async function createOperatorAccount(formData: FormData) {
  await requireAdmin();
  const loginName = text(formData, "loginName");
  const password = text(formData, "password");
  const displayName = text(formData, "displayName");
  if (!loginName || !password || !displayName) throw new Error("请填写运营账号、密码和姓名。");
  if (password.length < 8) throw new Error("密码至少 8 位。");
  const store = await getDataStore();
  if ((await store.listUsers()).some((user) => user.phone === loginName)) throw new Error("该运营账号已存在。");
  const requestedLimit = Number(text(formData, "dailyLimit") || "30");
  await store.createUser({
    phone: loginName,
    password,
    role: "user",
    storeName: displayName,
    storeType: "运营人员",
    cityArea: "",
    mainProjects: "",
    storeAdvantages: "",
    sourceChannel: "其他",
    planName: "standard_monthly",
    memberStatus: "paid",
    expiresAt: "2099-12-31",
    dailyLimit: Number.isFinite(requestedLimit) ? Math.max(1, requestedLimit) : 30,
    disabled: false,
  });
  revalidatePath("/agent-admin/operators");
  revalidatePath("/agent-admin/users");
}

export async function saveOperatorAssignment(formData: FormData) {
  await requireAdmin();
  const assignedUserId = text(formData, "assignedUserId");
  const organizationId = text(formData, "organizationId");
  const clientId = text(formData, "clientId");
  const generationLimit = Math.max(0, Number(text(formData, "generationLimit") || "0"));
  await (await getOpsStore()).saveAssignment({
    id: text(formData, "id") || undefined,
    assignedUserId,
    clientId,
    organizationId,
    generationLimit: Number.isFinite(generationLimit) ? generationLimit : 0,
  });
  revalidatePath("/agent-admin/operators");
  revalidatePath("/app");
}

export async function deleteOperatorAssignment(formData: FormData) {
  await requireAdmin();
  await (await getOpsStore()).deleteAssignment(text(formData, "id"));
  revalidatePath("/agent-admin/operators");
  revalidatePath("/app");
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}
