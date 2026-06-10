import { getPlanConfig, type MemberStatus, type PlanName } from "./plans";
import type { SceneKey } from "./scenes";

export type PermissionProfile = {
  disabled: boolean;
  expiresAt: string;
  memberStatus: MemberStatus;
  planName: PlanName;
};

export type PermissionReason =
  | "allowed"
  | "disabled"
  | "expired"
  | "daily_limit_reached"
  | "plan_locked";

export type GeneratePermission = {
  allowed: boolean;
  dailyLimit: number;
  reason: PermissionReason;
  remainingToday: number;
};

type CanGenerateInput = {
  profile: PermissionProfile;
  scene: SceneKey;
  todayCount: number;
  today: string;
};

export function canViewHistory(profile: PermissionProfile): boolean {
  return !profile.disabled;
}

export function canGenerate({ profile, scene, todayCount, today }: CanGenerateInput): GeneratePermission {
  const plan = getPlanConfig(profile.planName);
  const remainingToday = Math.max(plan.dailyLimit - todayCount, 0);

  if (profile.disabled || profile.memberStatus === "disabled") {
    return { allowed: false, dailyLimit: plan.dailyLimit, reason: "disabled", remainingToday };
  }

  if (profile.memberStatus === "expired" || isExpired(profile.expiresAt, today)) {
    return { allowed: false, dailyLimit: plan.dailyLimit, reason: "expired", remainingToday };
  }

  if (todayCount >= plan.dailyLimit) {
    return { allowed: false, dailyLimit: plan.dailyLimit, reason: "daily_limit_reached", remainingToday: 0 };
  }

  if (!plan.allowedScenes.includes(scene)) {
    return { allowed: false, dailyLimit: plan.dailyLimit, reason: "plan_locked", remainingToday };
  }

  return { allowed: true, dailyLimit: plan.dailyLimit, reason: "allowed", remainingToday };
}

function isExpired(expiresAt: string, today: string): boolean {
  return normalizeDate(expiresAt).getTime() < normalizeDate(today).getTime();
}

function normalizeDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
