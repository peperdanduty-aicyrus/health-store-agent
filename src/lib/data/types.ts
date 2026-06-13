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

export type WorkbenchAccountRole = "owner" | "subaccount";

export type WorkbenchAccount = {
  id: string;
  phone: string;
  password: string;
  role: WorkbenchAccountRole;
  displayName: string;
  note: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkbenchAccountInput = Omit<WorkbenchAccount, "id" | "createdAt" | "updatedAt">;

export type WorkbenchGenerationType =
  | "mealbox_video"
  | "promotion_copy"
  | "poster_prompt"
  | "moments_library";

export type WorkbenchGenerationRecord = {
  id: string;
  accountId: string;
  accountPhone: string;
  accountDisplayName: string;
  generationType: WorkbenchGenerationType;
  input: string;
  output: string;
  copied: boolean;
  prompt: string;
  modelProvider: string;
  modelName: string;
  createdAt: string;
};

export type CreateWorkbenchGenerationInput = Omit<WorkbenchGenerationRecord, "id" | "createdAt">;

export type WorkbenchGenerationFilter = {
  accountId?: string;
  generationType?: WorkbenchGenerationType;
};
