"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateWorkbenchContent } from "@/lib/ai/provider";
import { workbenchSessionCookieName, requireWorkbenchAccount, requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getDataStore } from "@/lib/data/repository";
import type { WorkbenchGenerationType } from "@/lib/data/types";
import { workbenchToolDefinitions } from "@/lib/domain/workbench";
import { sanitizeWorkbenchOutputForPrice } from "@/lib/prompts/workbench";
import { replaceSensitiveWords } from "@/lib/safety/sensitive-words";

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

  const generated = await generateWorkbenchContent({ input, type });
  const priceSafeContent = sanitizeWorkbenchOutputForPrice(generated.content, input);
  const safeResult = replaceSensitiveWords(priceSafeContent);
  const record = await (await getDataStore()).createWorkbenchGeneration({
    accountDisplayName: account.displayName,
    accountId: account.id,
    accountPhone: account.phone,
    copied: false,
    generationType: type,
    input: JSON.stringify(input),
    modelName: generated.model,
    modelProvider: generated.provider,
    output: safeResult.content,
    prompt: generated.prompt,
  });

  revalidatePath("/lvminglei/history");
  return {
    generationId: record.id,
    inputSummary: pickInputSummary(input, type),
    message:
      safeResult.replacements.length > 0
        ? `已生成，并自动替换风险表达：${safeResult.replacements.map((item) => `${item.from}→${item.to}`).join("、")}。`
        : "已生成，并保存到历史记录。",
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

function pickInputSummary(input: Record<string, string>, type: WorkbenchGenerationType): Record<string, string> {
  return {
    customerPain: input.customerPain || "",
    extraInfo: input.extraInfo || "",
    generationType: type,
    priceExposure: input.priceExposure || "",
    product: input.product || "",
    publishPlatform: input.publishPlatform || "",
    targetCustomer: input.targetCustomer || "",
    targetPlatform: input.targetPlatform || "",
    usageScene: input.usageScene || "",
  };
}
