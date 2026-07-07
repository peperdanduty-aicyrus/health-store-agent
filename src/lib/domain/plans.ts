import type { SceneKey } from "./scenes";
import { allSceneKeys } from "./scenes";

export type PlanName =
  | "temporary_opening"
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
  temporary_opening: {
    name: "temporary_opening",
    label: "7天体验",
    dailyLimit: 30,
    allowedScenes: allSceneKeys,
  },
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
    label: "代运营陪跑",
    dailyLimit: 60,
    allowedScenes: allSceneKeys,
  },
};

export function getPlanConfig(planName: PlanName): PlanConfig {
  return planConfigs[planName];
}
