"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateContent } from "@/lib/ai/provider";
import { sessionCookieName } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";
import type { CreateUserInput } from "@/lib/data/types";
import type { PlanName } from "@/lib/domain/plans";
import { canGenerate } from "@/lib/domain/permissions";
import type { SceneKey } from "@/lib/domain/scenes";
import { scanSensitiveWords } from "@/lib/safety/sensitive-words";

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

const requiredFields = ["storeName", "storeType", "cityArea", "contactName", "phone"];

export async function submitOpeningApplication(
  _previousState: OpeningApplicationFormState,
  formData: FormData,
): Promise<OpeningApplicationFormState> {
  const values = Object.fromEntries(formData.entries());

  for (const field of requiredFields) {
    if (!String(values[field] || "").trim()) {
      return {
        message: "请先填写门店名称、门店类型、城市 / 区域、联系人和手机号。",
        success: false,
      };
    }
  }

  const store = await getDataStore();
  await store.createOpeningApplication({
    cityArea: String(values.cityArea),
    contactName: String(values.contactName),
    interestedFeatures: String(values.interestedFeatures || ""),
    note: String(values.note || ""),
    phone: String(values.phone),
    storeName: String(values.storeName),
    storeType: String(values.storeType),
    wechatId: String(values.wechatId || ""),
  });
  revalidatePath("/cyrus");
  revalidatePath("/cyrus/applications");

  return {
    message: "信息已提交，我会尽快联系你确认开通方案。",
    success: true,
  };
}

export async function loginWithPassword(_previousState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const store = await getDataStore();
  const profile = await store.login(phone, password);

  if (!profile) {
    return { message: "账号或密码不正确，请确认后重试。" };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, profile.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  redirect(profile.role === "admin" ? "/cyrus" : "/app");
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
  const existing = (await store.listUsers()).find((user) => user.phone === String(formData.get("phone")));
  if (existing) {
    return { message: "这个手机号已经能登录，请确认是否重复创建。", success: false };
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
    storeAdvantages: String(formData.get("storeAdvantages") || ""),
    storeName: String(formData.get("storeName")),
    storeType: String(formData.get("storeType")),
  };

  await store.createUser(input);
  revalidatePath("/cyrus");
  revalidatePath("/cyrus/users");

  return { message: `已创建账号：${input.phone}，客户登录地址是 /login。`, success: true };
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
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (await store.listGenerations({ userId: profile.id }))
    .filter((record) => record.createdAt.slice(0, 10) === today).length;
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

  const generated = await generateContent({
    input,
    scene,
    storeProfile: profile,
    userId: profile.id,
  });
  const sensitiveCheck = scanSensitiveWords(generated.content);
  const record = await store.createGeneration({
    copied: false,
    extraInfo: input.extraInfo,
    generationType: scene,
    modelName: generated.model,
    modelProvider: generated.provider,
    phone: profile.phone,
    planName: profile.planName,
    projectName: input.projectName,
    prompt: generated.prompt,
    purpose: input.purpose,
    result: generated.content,
    sensitiveCheckResult: sensitiveCheck.message,
    storeName: profile.storeName,
    storeType: profile.storeType,
    targetCustomer: input.targetCustomer,
    userId: profile.id,
    userNote: "",
  });

  return {
    generationId: record.id,
    message: "已生成内容，请发布前结合门店实际情况人工确认。",
    result: generated.content,
    sensitiveCheck: sensitiveCheck.message,
    success: true,
  };
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
