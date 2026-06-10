import type { SceneKey } from "./scenes";
import { allSceneKeys } from "./scenes";

export type PlanName =
  | "basic_monthly"
  | "standard_monthly"
  | "internal_yearly"
  | "coaching";

export type MemberStatus = "paid" | "expired" | "disabled";

export type PlanConfig = {
  name: PlanName;
  label: string;
  dailyLimit: number;
  allowedScenes: SceneKey[];
};

const basicScenes: SceneKey[] = ["xiaohongshu", "moments", "official_account"];

const planConfigs: Record<PlanName, PlanConfig> = {
  basic_monthly: {
    name: "basic_monthly",
    label: "基础月卡",
    dailyLimit: 30,
    allowedScenes: basicScenes,
  },
  standard_monthly: {
    name: "standard_monthly",
    label: "标准月卡",
    dailyLimit: 30,
    allowedScenes: allSceneKeys,
  },
  internal_yearly: {
    name: "internal_yearly",
    label: "正式年卡",
    dailyLimit: 30,
    allowedScenes: allSceneKeys,
  },
  coaching: {
    name: "coaching",
    label: "陪跑用户",
    dailyLimit: 60,
    allowedScenes: allSceneKeys,
  },
};

export function getPlanConfig(planName: PlanName): PlanConfig {
  return planConfigs[planName];
}
