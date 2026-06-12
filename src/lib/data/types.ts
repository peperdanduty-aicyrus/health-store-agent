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

export type OpeningApplicationStatus = "new" | "contacted" | "opened";

export type OpeningApplication = {
  id: string;
  storeName: string;
  storeType: string;
  cityArea: string;
  contactName: string;
  phone: string;
  wechatId: string;
  interestedFeatures: string;
  note: string;
  openedUserId: string;
  status: OpeningApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateOpeningApplicationInput = Omit<
  OpeningApplication,
  "id" | "openedUserId" | "status" | "createdAt" | "updatedAt"
>;

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
