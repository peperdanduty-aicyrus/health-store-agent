"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateStoreProfileSummary } from "@/lib/ai/provider";
import { generateSafeSceneContent } from "@/lib/ai/generation-service";
import { isBillableGeneration } from "@/lib/ai/generation-record";
import { sessionCookieName } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";
import type { CreateUserInput, Profile, StoreProfileUploadBy, UpsertStoreProfileInput } from "@/lib/data/types";
import type { PlanName } from "@/lib/domain/plans";
import { canGenerate } from "@/lib/domain/permissions";
import type { SceneKey } from "@/lib/domain/scenes";
import { normalizeSourceChannel, normalizeStoreType } from "@/lib/domain/store-types";
import { replaceSensitiveWords } from "@/lib/safety/sensitive-words";
import { chinaDate } from "@/lib/ops/date";

export type OpeningApplicationFormState = {
  message: string;
  success: boolean;
};

export type LoginFormState = {
  message: string;
};

export type GenerationFormState = {
  generationId?: string;
  message: string;
  result?: string;
  sensitiveCheck?: string;
  success: boolean;
};

export type CreateMerchantFormState = {
  message: string;
  success: boolean;
};

export type PasswordFormState = {
  message: string;
  success: boolean;
};

export type DeleteActionState = {
  message: string;
  success: boolean;
};

export type StoreProfileActionState = {
  message: string;
  profileSummary?: string;
  rawText?: string;
  success: boolean;
};

const requiredFields = ["storeName", "storeType", "phone"];

export async function submitOpeningApplication(
  _previousState: OpeningApplicationFormState,
  formData: FormData,
): Promise<OpeningApplicationFormState> {
  const values = Object.fromEntries(formData.entries());

  for (const field of requiredFields) {
    if (!String(values[field] || "").trim()) {
      return {
        message: "请先填写门店名称、门店类型和微信号 / 手机号。",
        success: false,
      };
    }
  }

  const store = await getDataStore();
  await store.createOpeningApplication({
    cityArea: String(values.cityArea || ""),
    contactName: String(values.contactName || values.phone),
    interestedFeatures: String(values.interestedFeatures || ""),
    note: String(values.note || ""),
    phone: String(values.phone),
    sourceChannel: "其他",
    storeName: String(values.storeName),
    storeType: normalizeStoreType(String(values.storeType)),
    wechatId: String(values.wechatId || values.phone),
  });
  revalidatePath("/agent-admin");
  revalidatePath("/agent-admin/applications");

  return {
    message: "已提交申请。请添加微信或等待人工确认，确认后发放7天体验账号。",
    success: true,
  };
}

export async function loginWithPassword(_previousState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const store = await getDataStore();
  const profile = await store.login(phone, password);

  if (!profile) {
    const disabledProfile = (await store.listUsers()).find(
      (user) => user.phone === phone && user.password === password && user.disabled,
    );
    if (disabledProfile) {
      return { message: "账号已被禁用，请联系管理员。" };
    }
    return { message: "账号或密码不正确，请确认后重试。" };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, profile.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  redirect(profile.role === "admin" ? "/agent-admin" : "/app");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  redirect("/login");
}

export async function createMerchantAccount(
  _previousState: CreateMerchantFormState,
  formData: FormData,
): Promise<CreateMerchantFormState> {
  const cookieStore = await cookies();
  const adminId = cookieStore.get(sessionCookieName)?.value;
  const store = await getDataStore();
  const admin = adminId ? await store.getUserById(adminId) : null;

  if (!admin || admin.role !== "admin") {
    return { message: "请先登录管理员后台。", success: false };
  }

  const required = ["phone", "password", "storeName", "storeType", "cityArea", "expiresAt"];
  for (const field of required) {
    if (!String(formData.get(field) || "").trim()) {
      return { message: "请填写手机号、密码、门店名称、门店类型、城市区域和到期日期。", success: false };
    }
  }

  const dailyLimit = Number(formData.get("dailyLimit") || "30");
  if (!Number.isFinite(dailyLimit) || dailyLimit <= 0) {
    return { message: "每日次数必须是大于 0 的数字。", success: false };
  }

  const planName = String(formData.get("planName") || "standard_monthly") as PlanName;
  const applicationId = String(formData.get("applicationId") || "");
  const existing = (await store.listUsers()).find((user) => user.phone === String(formData.get("phone")));
  if (existing) {
    return { message: "该手机号已存在客户账号", success: false };
  }

  const input: CreateUserInput = {
    cityArea: String(formData.get("cityArea")),
    dailyLimit,
    disabled: false,
    expiresAt: String(formData.get("expiresAt")),
    mainProjects: String(formData.get("mainProjects") || ""),
    memberStatus: "paid",
    password: String(formData.get("password")),
    phone: String(formData.get("phone")),
    planName,
    role: "user",
    sourceChannel: normalizeSourceChannel(String(formData.get("sourceChannel") || "其他")),
    storeAdvantages: String(formData.get("storeAdvantages") || ""),
    storeName: String(formData.get("storeName")),
    storeType: normalizeStoreType(String(formData.get("storeType"))),
  };

  const created = await store.createUser(input);
  if (applicationId) {
    await store.updateOpeningApplicationStatus(applicationId, "opened", created.id);
  }
  revalidatePath("/agent-admin");
  revalidatePath("/agent-admin/applications");
  revalidatePath("/agent-admin/users");

  return { message: `已创建账号：${input.phone}，客户登录地址是 /login。`, success: true };
}

export async function toggleCustomerDisabled(
  _previousState: CreateMerchantFormState,
  formData: FormData,
): Promise<CreateMerchantFormState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  const userId = String(formData.get("userId") || "");
  const disabled = String(formData.get("disabled") || "") === "true";
  const updated = await (await getDataStore()).updateUserDisabled(userId, disabled);

  if (!updated) {
    return { message: "未找到可操作的客户账号。", success: false };
  }

  revalidatePath("/agent-admin/users");
  revalidatePath(`/agent-admin/users/${userId}`);
  return { message: disabled ? "已禁用该客户账号。" : "已启用该客户账号。", success: true };
}

export async function resetCustomerPassword(
  _previousState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  const userId = String(formData.get("userId") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const validation = validateNewPassword(newPassword, confirmPassword);
  if (validation) {
    return { message: validation, success: false };
  }

  const store = await getDataStore();
  const user = await store.getUserById(userId);
  if (!user || user.role !== "user") {
    return { message: "未找到客户账号。", success: false };
  }

  const updated = await store.updateUserPassword(userId, newPassword);
  if (!updated) {
    return { message: "未找到客户账号。", success: false };
  }

  revalidatePath("/agent-admin/users");
  revalidatePath(`/agent-admin/users/${userId}`);
  return { message: "客户密码已重置。", success: true };
}

export async function extendCustomerForGoodReview(
  _previousState: CreateMerchantFormState,
  formData: FormData,
): Promise<CreateMerchantFormState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  const userId = String(formData.get("userId") || "");
  const updated = await (await getDataStore()).extendUserExpiryByDays(userId, 30, "好评延长1个月");
  if (!updated) {
    return { message: "未找到可延期的客户账号。", success: false };
  }

  revalidatePath("/agent-admin/users");
  revalidatePath(`/agent-admin/users/${userId}`);
  revalidatePath("/app");
  revalidatePath("/app/account");
  return { message: `已延长30天，新到期日：${updated.expiresAt}。`, success: true };
}

export async function deleteOpeningApplication(
  _previousState: DeleteActionState,
  formData: FormData,
): Promise<DeleteActionState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  const applicationId = String(formData.get("applicationId") || "");
  if (!applicationId) {
    return { message: "删除失败，请稍后重试。", success: false };
  }

  try {
    const deleted = await (await getDataStore()).deleteOpeningApplication(applicationId);
    if (!deleted) {
      return { message: "删除失败，请稍后重试。", success: false };
    }
  } catch {
    return { message: "删除失败，请稍后重试。", success: false };
  }

  revalidatePath("/agent-admin");
  revalidatePath("/agent-admin/applications");
  return { message: "开通申请已删除。", success: true };
}

export async function deleteGenerationRecord(
  _previousState: DeleteActionState,
  formData: FormData,
): Promise<DeleteActionState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  const generationId = String(formData.get("generationId") || "");
  if (!generationId) {
    return { message: "删除失败，请稍后重试。", success: false };
  }

  try {
    const deleted = await (await getDataStore()).deleteGeneration(generationId);
    if (!deleted) {
      return { message: "删除失败，请稍后重试。", success: false };
    }
  } catch {
    return { message: "删除失败，请稍后重试。", success: false };
  }

  revalidatePath("/agent-admin");
  revalidatePath("/agent-admin/generations");
  return { message: "生成记录已删除。", success: true };
}

export async function deleteAllGenerationRecords(
  _previousState: DeleteActionState,
  _formData: FormData,
): Promise<DeleteActionState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  try {
    await (await getDataStore()).deleteAllGenerations();
  } catch {
    return { message: "删除失败，请稍后重试。", success: false };
  }
  revalidatePath("/agent-admin");
  revalidatePath("/agent-admin/generations");
  return { message: "全部生成记录已删除。", success: true };
}

export async function changeOwnPassword(
  _previousState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;
  const store = await getDataStore();
  const profile = userId ? await store.getUserById(userId) : null;

  if (!profile) {
    return { message: "请先登录。", success: false };
  }

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (profile.password !== currentPassword) {
    return { message: "原密码不正确。", success: false };
  }

  const validation = validateNewPassword(newPassword, confirmPassword);
  if (validation) {
    return { message: validation, success: false };
  }

  await store.updateUserPassword(profile.id, newPassword);
  cookieStore.delete(sessionCookieName);
  redirect(profile.role === "admin" ? "/agent-admin" : "/login");
}

export async function saveCustomerStoreProfileText(
  _previousState: StoreProfileActionState,
  formData: FormData,
): Promise<StoreProfileActionState> {
  try {
    const profile = await requireCustomerProfile();
    if (!profile) {
      return { message: "请先登录后再保存。", success: false };
    }

    const input = await buildStoreProfileTextInput({
      profile,
      profileSummary: String(formData.get("profileSummary") || ""),
      rawText: String(formData.get("rawText") || ""),
      uploadBy: "customer",
    });
    await (await getDataStore()).upsertStoreProfile(input);
    revalidatePath("/app/store-profile");
    revalidatePath("/agent-admin/store-profiles");
    return {
      message: "店铺资料已保存，后续生成内容会优先参考这份资料。",
      profileSummary: input.profileSummary,
      rawText: input.extractedText,
      success: true,
    };
  } catch (error) {
    return { message: getTextProfileErrorMessage(error, "保存失败，请稍后重试。"), success: false };
  }
}

export async function summarizeCustomerStoreProfileText(
  _previousState: StoreProfileActionState,
  formData: FormData,
): Promise<StoreProfileActionState> {
  try {
    const profile = await requireCustomerProfile();
    if (!profile) {
      return { message: "请先登录后再操作。", success: false };
    }

    const rawText = normalizeStoreProfileText(String(formData.get("rawText") || ""));
    if (!rawText) {
      return { message: "请先填写店铺原始资料。", success: false };
    }

    const summary = await summarizeRawStoreProfileText(profile, rawText);
    const input = await buildStoreProfileTextInput({
      profile,
      profileSummary: summary,
      rawText,
      uploadBy: "customer",
    });
    await (await getDataStore()).upsertStoreProfile(input);
    revalidatePath("/app/store-profile");
    revalidatePath("/agent-admin/store-profiles");
    return {
      message: "AI 已整理资料摘要，可继续编辑后保存。",
      profileSummary: input.profileSummary,
      rawText: input.extractedText,
      success: true,
    };
  } catch (error) {
    return { message: getTextProfileErrorMessage(error, "AI整理失败，请稍后重试，或先手动填写资料摘要。"), success: false };
  }
}

export async function saveAdminStoreProfileText(
  _previousState: StoreProfileActionState,
  formData: FormData,
): Promise<StoreProfileActionState> {
  try {
    const admin = await requireAdminProfile();
    if (!admin) {
      return { message: "请先登录管理员后台。", success: false };
    }

    const store = await getDataStore();
    const userId = String(formData.get("userId") || "");
    const profile = userId ? await store.getUserById(userId) : null;
    if (!profile || profile.role !== "user") {
      return { message: "未找到客户账号。", success: false };
    }

    const input = await buildStoreProfileTextInput({
      profile,
      profileSummary: String(formData.get("profileSummary") || ""),
      rawText: String(formData.get("rawText") || ""),
      uploadBy: "admin",
    });
    await store.upsertStoreProfile(input);
    revalidatePath("/agent-admin/store-profiles");
    revalidatePath(`/agent-admin/store-profiles/${profile.id}`);
    revalidatePath("/app/store-profile");
    return {
      message: "已保存客户店铺资料。",
      profileSummary: input.profileSummary,
      rawText: input.extractedText,
      success: true,
    };
  } catch (error) {
    return { message: getTextProfileErrorMessage(error, "保存失败，请稍后重试。"), success: false };
  }
}

export async function summarizeAdminStoreProfileText(
  _previousState: StoreProfileActionState,
  formData: FormData,
): Promise<StoreProfileActionState> {
  try {
    const admin = await requireAdminProfile();
    if (!admin) {
      return { message: "请先登录管理员后台。", success: false };
    }

    const store = await getDataStore();
    const userId = String(formData.get("userId") || "");
    const profile = userId ? await store.getUserById(userId) : null;
    if (!profile || profile.role !== "user") {
      return { message: "未找到客户账号。", success: false };
    }

    const rawText = normalizeStoreProfileText(String(formData.get("rawText") || ""));
    if (!rawText) {
      return { message: "请先填写店铺原始资料。", success: false };
    }

    const summary = await summarizeRawStoreProfileText(profile, rawText);
    const input = await buildStoreProfileTextInput({
      profile,
      profileSummary: summary,
      rawText,
      uploadBy: "admin",
    });
    await store.upsertStoreProfile(input);
    revalidatePath("/agent-admin/store-profiles");
    revalidatePath(`/agent-admin/store-profiles/${profile.id}`);
    revalidatePath("/app/store-profile");
    return {
      message: "AI 已整理客户资料摘要，可继续编辑后保存。",
      profileSummary: input.profileSummary,
      rawText: input.extractedText,
      success: true,
    };
  } catch (error) {
    return { message: getTextProfileErrorMessage(error, "AI整理失败，请稍后重试，或先手动填写资料摘要。"), success: false };
  }
}

export async function saveCustomerStoreProfileSummary(
  _previousState: StoreProfileActionState,
  formData: FormData,
): Promise<StoreProfileActionState> {
  const profile = await requireCustomerProfile();
  if (!profile) {
    return { message: "请先登录后再保存。", success: false };
  }

  return saveStoreProfileSummary(profile.id, String(formData.get("profileSummary") || ""), ["/app/store-profile"]);
}

export async function saveAdminStoreProfileSummary(
  _previousState: StoreProfileActionState,
  formData: FormData,
): Promise<StoreProfileActionState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  const userId = String(formData.get("userId") || "");
  return saveStoreProfileSummary(userId, String(formData.get("profileSummary") || ""), [
    "/agent-admin/store-profiles",
    `/agent-admin/store-profiles/${userId}`,
  ]);
}

export async function deleteCustomerStoreProfile(
  _previousState: StoreProfileActionState,
  _formData: FormData,
): Promise<StoreProfileActionState> {
  const profile = await requireCustomerProfile();
  if (!profile) {
    return { message: "请先登录后再删除。", success: false };
  }

  return deleteStoreProfileForUser(profile.id, ["/app/store-profile", "/agent-admin/store-profiles"]);
}

export async function deleteAdminStoreProfile(
  _previousState: StoreProfileActionState,
  formData: FormData,
): Promise<StoreProfileActionState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  const userId = String(formData.get("userId") || "");
  return deleteStoreProfileForUser(userId, ["/agent-admin/store-profiles", `/agent-admin/store-profiles/${userId}`]);
}

export async function regenerateCustomerStoreProfileSummary(
  _previousState: StoreProfileActionState,
  _formData: FormData,
): Promise<StoreProfileActionState> {
  const profile = await requireCustomerProfile();
  if (!profile) {
    return { message: "请先登录后再操作。", success: false };
  }

  return regenerateStoreProfileSummary(profile, ["/app/store-profile", "/agent-admin/store-profiles"]);
}

export async function regenerateAdminStoreProfileSummary(
  _previousState: StoreProfileActionState,
  formData: FormData,
): Promise<StoreProfileActionState> {
  const admin = await requireAdminProfile();
  if (!admin) {
    return { message: "请先登录管理员后台。", success: false };
  }

  const store = await getDataStore();
  const userId = String(formData.get("userId") || "");
  const profile = userId ? await store.getUserById(userId) : null;
  if (!profile || profile.role !== "user") {
    return { message: "未找到客户账号。", success: false };
  }

  return regenerateStoreProfileSummary(profile, ["/agent-admin/store-profiles", `/agent-admin/store-profiles/${profile.id}`]);
}

export async function markGeneratedContentCopied(generationId: string): Promise<void> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;
  const store = await getDataStore();
  const profile = userId ? await store.getUserById(userId) : null;

  if (!profile) {
    return;
  }

  const record = await store.getGenerationById(generationId);
  if (!record) {
    return;
  }
  if (profile.role !== "admin" && record.userId !== profile.id) {
    return;
  }

  await store.markGenerationCopied(generationId);
  revalidatePath("/app/history");
  revalidatePath("/agent-admin/generations");
}

export async function generateForScene(
  _previousState: GenerationFormState,
  formData: FormData,
): Promise<GenerationFormState> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;
  const store = await getDataStore();
  const profile = userId ? await store.getUserById(userId) : null;

  if (!profile || profile.role !== "user") {
    return { message: "请先登录后再生成。", success: false };
  }

  const scene = String(formData.get("scene") || "") as SceneKey;
  const today = chinaDate();
  const todayCount = (await store.listGenerations({ userId: profile.id }))
    .filter((record) => record.createdAt.slice(0, 10) === today && isBillableGeneration(record)).length;
  const permission = canGenerate({ profile, scene, today, todayCount });

  if (!permission.allowed) {
    return {
      message: getPermissionMessage(permission.reason),
      success: false,
    };
  }

  const input = {
    extraInfo: String(formData.get("extraInfo") || ""),
    projectName: String(formData.get("projectName") || ""),
    purpose: String(formData.get("purpose") || ""),
    targetCustomer: String(formData.get("targetCustomer") || ""),
  };

  if (!input.projectName || !input.targetCustomer || !input.purpose) {
    return { message: "请填写项目名称、目标客户和宣传目的。", success: false };
  }

  const storeProfileRecord = await store.getStoreProfileByUserId(profile.id);
  const storeProfileSummary = storeProfileRecord?.profileSummary.trim() || "";

  try {
    const generated = await generateSafeSceneContent({
      input,
      scene,
      storeProfile: {
        ...profile,
        storeProfileSummary,
      },
      userId: profile.id,
    });
    const commonRecord = {
      copied: false,
      elapsedMs: generated.elapsedMs,
      extraInfo: input.extraInfo,
      finishReason: generated.finishReason,
      generationType: scene,
      modelName: generated.model || "unknown",
      modelProvider: generated.provider || "unknown",
      phone: profile.phone,
      planName: profile.planName,
      projectName: input.projectName,
      prompt: generated.prompt,
      promptVersion: generated.promptVersion,
      purpose: input.purpose,
      rawResponse: generated.rawResponse,
      requestId: generated.requestId,
      storeName: profile.storeName,
      storeType: profile.storeType,
      targetCustomer: input.targetCustomer,
      tokenUsage: generated.tokenUsage,
      usedStoreProfile: Boolean(storeProfileSummary),
      userId: profile.id,
      userNote: "",
    };

    if (generated.status === "failed") {
      await store.createGeneration({
        ...commonRecord,
        cleanedContent: "",
        errorCode: generated.errorCode,
        errorMessage: generated.errorMessage,
        result: "",
        sensitiveCheckResult: "生成失败，未进入敏感词处理。",
        status: "failed",
      });
      return { message: generated.publicMessage, success: false };
    }

    const safeResult = replaceSensitiveWords(generated.cleanedContent);
    const sensitiveCheckResult =
      safeResult.replacements.length > 0
        ? `已自动替换风险表达：${safeResult.replacements.map((item) => `${item.from}→${item.to}`).join("、")}。`
        : "未发现明显高风险表达。";
    const record = await store.createGeneration({
      ...commonRecord,
      cleanedContent: safeResult.content,
      errorCode: "",
      errorMessage: "",
      result: safeResult.content,
      sensitiveCheckResult,
      status: "success",
    });

    return {
      generationId: record.id,
      message: "已生成内容，已自动处理常见敏感表达，请发布前结合门店实际情况人工确认。",
      result: safeResult.content,
      success: true,
    };
  } catch {
    return { message: "生成失败，请稍后重试。", success: false };
  }
}

function getPermissionMessage(reason: string): string {
  const messages: Record<string, string> = {
    daily_limit_reached: "今日生成次数已用完，请明天再用或添加微信升级。",
    disabled: "当前账号已停用，请联系管理员。",
    expired: "当前会员已过期，可以查看历史记录，但不能生成新内容。",
    plan_locked: "当前套餐暂未开放该功能，升级标准月卡或正式年卡即可使用。",
  };

  return messages[reason] ?? "当前账号暂不能生成。";
}

async function requireAdminProfile() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get(sessionCookieName)?.value;
  const store = await getDataStore();
  const admin = adminId ? await store.getUserById(adminId) : null;
  return admin?.role === "admin" ? admin : null;
}

async function requireCustomerProfile() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;
  const store = await getDataStore();
  const profile = userId ? await store.getUserById(userId) : null;
  return profile?.role === "user" ? profile : null;
}

async function buildStoreProfileTextInput({
  profile,
  profileSummary,
  rawText,
  uploadBy,
}: {
  profile: Profile;
  profileSummary: string;
  rawText: string;
  uploadBy: StoreProfileUploadBy;
}): Promise<UpsertStoreProfileInput> {
  const normalizedRawText = normalizeStoreProfileText(rawText);
  const normalizedSummary = normalizeStoreProfileText(profileSummary);
  if (!normalizedRawText && !normalizedSummary) {
    throw new Error("请先填写店铺原始资料或店铺资料摘要。");
  }

  const safeSummary = replaceSensitiveWords(normalizedSummary).content;

  return {
    extractedText: normalizedRawText,
    extractedTextPreview: normalizedRawText.slice(0, 2000),
    pdfFileName: "",
    pdfFilePath: "",
    profileSummary: safeSummary,
    storeName: profile.storeName,
    uploadBy,
    userId: profile.id,
  };
}

async function summarizeRawStoreProfileText(profile: Profile, rawText: string): Promise<string> {
  const generated = await generateStoreProfileSummary({
    extractedText: rawText.slice(0, 12000),
    storeProfile: profile,
  });
  return replaceSensitiveWords(generated.content).content;
}

function normalizeStoreProfileText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function saveStoreProfileSummary(
  userId: string,
  profileSummary: string,
  pathsToRevalidate: string[],
): Promise<StoreProfileActionState> {
  if (!userId) {
    return { message: "保存失败，请稍后重试。", success: false };
  }

  const summary = profileSummary.trim();
  if (!summary) {
    return { message: "请先填写店铺资料摘要。", success: false };
  }

  const safeSummary = replaceSensitiveWords(summary).content;
  try {
    const updated = await (await getDataStore()).updateStoreProfileSummary(userId, safeSummary);
    if (!updated) {
      return { message: "保存失败，请稍后重试。", success: false };
    }
  } catch {
    return { message: "保存失败，请稍后重试。", success: false };
  }

  for (const path of pathsToRevalidate) {
    revalidatePath(path);
  }
  return { message: "店铺资料已保存，后续生成内容会优先参考这份资料。", success: true };
}

async function deleteStoreProfileForUser(userId: string, pathsToRevalidate: string[]): Promise<StoreProfileActionState> {
  if (!userId) {
    return { message: "删除失败，请稍后重试。", success: false };
  }

  try {
    const deleted = await (await getDataStore()).deleteStoreProfile(userId);
    if (!deleted) {
      return { message: "删除失败，请稍后重试。", success: false };
    }
  } catch {
    return { message: "删除失败，请稍后重试。", success: false };
  }

  for (const path of pathsToRevalidate) {
    revalidatePath(path);
  }
  return { message: "店铺资料已删除。", success: true };
}

async function regenerateStoreProfileSummary(profile: Profile, pathsToRevalidate: string[]): Promise<StoreProfileActionState> {
  const store = await getDataStore();
  const record = await store.getStoreProfileByUserId(profile.id);
  if (!record || !record.extractedText.trim()) {
    return { message: "未找到可重新整理摘要的店铺原始资料。", success: false };
  }

  try {
    const generated = await generateStoreProfileSummary({
      extractedText: normalizeStoreProfileText(record.extractedText).slice(0, 12000),
      storeProfile: profile,
    });
    const safeSummary = replaceSensitiveWords(generated.content).content;
    const updated = await store.updateStoreProfileSummary(profile.id, safeSummary);
    if (!updated) {
      return { message: "重新生成失败，请稍后重试。", success: false };
    }
  } catch (error) {
    return { message: getActionErrorMessage(error, "重新生成失败，请稍后重试。"), success: false };
  }

  for (const path of pathsToRevalidate) {
    revalidatePath(path);
  }
  return { message: "资料摘要已重新生成。", success: true };
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getTextProfileErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  const userSafeMessages = [
    "请先填写店铺原始资料。",
    "请先填写店铺原始资料或店铺资料摘要。",
    "请先登录后再保存。",
    "请先登录后再操作。",
    "请先登录管理员后台。",
    "未找到客户账号。",
  ];
  return userSafeMessages.includes(message) ? message : fallback;
}

function validateNewPassword(newPassword: string, confirmPassword: string): string {
  if (!newPassword || !confirmPassword) {
    return "请填写新密码和确认新密码。";
  }
  if (newPassword.length < 6) {
    return "新密码至少 6 位。";
  }
  if (newPassword !== confirmPassword) {
    return "两次输入的新密码不一致。";
  }
  return "";
}
