"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateContent } from "@/lib/ai/provider";
import { sessionCookieName } from "@/lib/auth/session";
import { mockStore } from "@/lib/data/store";
import { canGenerate } from "@/lib/domain/permissions";
import type { SceneKey } from "@/lib/domain/scenes";
import { scanSensitiveWords } from "@/lib/safety/sensitive-words";

export type TrialApplicationFormState = {
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

const requiredFields = ["storeName", "storeType", "cityArea", "contactName", "phone"];

export async function submitTrialApplication(
  _previousState: TrialApplicationFormState,
  formData: FormData,
): Promise<TrialApplicationFormState> {
  const values = Object.fromEntries(formData.entries());

  for (const field of requiredFields) {
    if (!String(values[field] || "").trim()) {
      return {
        message: "请先填写门店名称、门店类型、城市 / 区域、联系人和手机号。",
        success: false,
      };
    }
  }

  mockStore.createTrialApplication({
    cityArea: String(values.cityArea),
    contactName: String(values.contactName),
    interestedFeatures: String(values.interestedFeatures || ""),
    note: String(values.note || ""),
    phone: String(values.phone),
    storeName: String(values.storeName),
    storeType: String(values.storeType),
    wechatId: String(values.wechatId || ""),
  });

  return {
    message: "申请已提交，请添加微信，人工开通体验权限。",
    success: true,
  };
}

export async function loginWithPassword(_previousState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const profile = mockStore.login(phone, password);

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

export async function generateForScene(
  _previousState: GenerationFormState,
  formData: FormData,
): Promise<GenerationFormState> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(sessionCookieName)?.value;
  const profile = userId ? mockStore.getUserById(userId) : null;

  if (!profile || profile.role !== "user") {
    return { message: "请先登录后再生成。", success: false };
  }

  const scene = String(formData.get("scene") || "") as SceneKey;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = mockStore
    .listGenerations({ userId: profile.id })
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
  const record = mockStore.createGeneration({
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
    plan_locked: "当前套餐暂未开放该功能，升级标准月卡或内测年卡即可使用。",
  };

  return messages[reason] ?? "当前账号暂不能生成。";
}
