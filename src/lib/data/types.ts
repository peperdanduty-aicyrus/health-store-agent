import type { MemberStatus, PlanName } from "../domain/plans";
import type { SceneKey } from "../domain/scenes";
import type { SourceChannel } from "../domain/store-types";

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
  sourceChannel: SourceChannel;
  planName: PlanName;
  memberStatus: MemberStatus;
  expiresAt: string;
  dailyLimit: number;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = Omit<Profile, "id" | "createdAt" | "updatedAt" | "sourceChannel"> & {
  sourceChannel?: SourceChannel;
};

export type OpeningApplicationStatus = "new" | "contacted" | "opened" | "ignored";

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
  sourceChannel: SourceChannel;
  openedUserId: string;
  status: OpeningApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateOpeningApplicationInput = Omit<
  OpeningApplication,
  "id" | "openedUserId" | "status" | "createdAt" | "updatedAt" | "sourceChannel"
> & { sourceChannel?: SourceChannel };

export type AccountOperationLog = {
  id: string;
  userId: string;
  action: "good_review_extension";
  days: number;
  note: string;
  createdAt: string;
};

export type GenerationStatus = "success" | "failed" | "legacy";

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
  usedStoreProfile: boolean;
  userNote: string;
  modelProvider: string;
  modelName: string;
  status: GenerationStatus;
  rawResponse: string;
  cleanedContent: string;
  errorCode: string;
  errorMessage: string;
  requestId: string;
  finishReason: string;
  tokenUsage: string;
  elapsedMs: number | null;
  promptVersion: string;
  createdAt: string;
};

type GenerationDiagnosticFields =
  | "status"
  | "rawResponse"
  | "cleanedContent"
  | "errorCode"
  | "errorMessage"
  | "requestId"
  | "finishReason"
  | "tokenUsage"
  | "elapsedMs"
  | "promptVersion";

export type CreateGenerationInput = Omit<GenerationRecord, "id" | "createdAt" | GenerationDiagnosticFields> &
  Partial<Pick<GenerationRecord, GenerationDiagnosticFields>>;

export type GenerationFilter = {
  userId?: string;
  generationType?: SceneKey;
  planName?: PlanName;
  storeType?: string;
};

export type StoreProfileUploadBy = "customer" | "admin";

export type StoreProfileRecord = {
  id: string;
  userId: string;
  storeName: string;
  pdfFileName: string;
  pdfFilePath: string;
  extractedTextPreview: string;
  extractedText: string;
  profileSummary: string;
  uploadBy: StoreProfileUploadBy;
  createdAt: string;
  updatedAt: string;
};

export type UpsertStoreProfileInput = Omit<StoreProfileRecord, "id" | "createdAt" | "updatedAt">;

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
