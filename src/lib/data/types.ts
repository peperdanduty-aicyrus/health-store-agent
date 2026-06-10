import type { MemberStatus, PlanName } from "../domain/plans";
import type { SceneKey } from "../domain/scenes";

export type UserRole = "admin" | "user";

export type Profile = {
  id: string;
  phone: string;
  password: string;
  role: UserRole;
  storeName: string;
  storeType: string;
  cityArea: string;
  mainProjects: string;
  storeAdvantages: string;
  planName: PlanName;
  memberStatus: MemberStatus;
  expiresAt: string;
  dailyLimit: number;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = Omit<Profile, "id" | "createdAt" | "updatedAt">;

export type TrialApplicationStatus = "new" | "contacted" | "opened";

export type TrialApplication = {
  id: string;
  storeName: string;
  storeType: string;
  cityArea: string;
  contactName: string;
  phone: string;
  wechatId: string;
  interestedFeatures: string;
  note: string;
  status: TrialApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateTrialApplicationInput = Omit<TrialApplication, "id" | "status" | "createdAt" | "updatedAt">;

export type GenerationRecord = {
  id: string;
  userId: string;
  phone: string;
  storeName: string;
  storeType: string;
  planName: PlanName;
  generationType: SceneKey;
  projectName: string;
  targetCustomer: string;
  purpose: string;
  extraInfo: string;
  prompt: string;
  result: string;
  sensitiveCheckResult: string;
  copied: boolean;
  userNote: string;
  modelProvider: string;
  modelName: string;
  createdAt: string;
};

export type CreateGenerationInput = Omit<GenerationRecord, "id" | "createdAt">;

export type GenerationFilter = {
  userId?: string;
  generationType?: SceneKey;
  planName?: PlanName;
  storeType?: string;
};

