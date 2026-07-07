import { mockStore } from "./store";
import { createD1Store, type D1DatabaseLike } from "./store-d1";
import { assertAgentMode } from "../app-mode";
import type {
  AccountOperationLog,
  CreateGenerationInput,
  CreateOpeningApplicationInput,
  CreateUserInput,
  CreateWorkbenchAccountInput,
  CreateWorkbenchGenerationInput,
  GenerationFilter,
  GenerationRecord,
  Profile,
  OpeningApplication,
  OpeningApplicationStatus,
  StoreProfileRecord,
  UpsertStoreProfileInput,
  WorkbenchAccount,
  WorkbenchGenerationFilter,
  WorkbenchGenerationRecord,
} from "./types";

export type DataStore = {
  createGeneration(input: CreateGenerationInput): Promise<GenerationRecord> | GenerationRecord;
  createOpeningApplication(input: CreateOpeningApplicationInput): Promise<OpeningApplication> | OpeningApplication;
  createUser(input: CreateUserInput): Promise<Profile> | Profile;
  createWorkbenchAccount(input: CreateWorkbenchAccountInput): Promise<WorkbenchAccount> | WorkbenchAccount;
  createWorkbenchGeneration(input: CreateWorkbenchGenerationInput): Promise<WorkbenchGenerationRecord> | WorkbenchGenerationRecord;
  upsertStoreProfile(input: UpsertStoreProfileInput): Promise<StoreProfileRecord> | StoreProfileRecord;
  deleteAllGenerations(): Promise<number> | number;
  deleteGeneration(id: string): Promise<boolean> | boolean;
  deleteOpeningApplication(id: string): Promise<boolean> | boolean;
  deleteStoreProfile(userId: string): Promise<boolean> | boolean;
  deleteWorkbenchGeneration(id: string): Promise<boolean> | boolean;
  getGenerationById(id: string): Promise<GenerationRecord | null> | GenerationRecord | null;
  getStoreProfileByUserId(userId: string): Promise<StoreProfileRecord | null> | StoreProfileRecord | null;
  getUserById(id: string): Promise<Profile | null> | Profile | null;
  getWorkbenchAccountById(id: string): Promise<WorkbenchAccount | null> | WorkbenchAccount | null;
  getWorkbenchGenerationById(id: string): Promise<WorkbenchGenerationRecord | null> | WorkbenchGenerationRecord | null;
  listApplications(): Promise<OpeningApplication[]> | OpeningApplication[];
  listAccountOperationLogs(userId?: string): Promise<AccountOperationLog[]> | AccountOperationLog[];
  listGenerations(filter?: GenerationFilter): Promise<GenerationRecord[]> | GenerationRecord[];
  listStoreProfiles(): Promise<StoreProfileRecord[]> | StoreProfileRecord[];
  listUsers(): Promise<Profile[]> | Profile[];
  listWorkbenchAccounts(): Promise<WorkbenchAccount[]> | WorkbenchAccount[];
  listWorkbenchGenerations(filter?: WorkbenchGenerationFilter): Promise<WorkbenchGenerationRecord[]> | WorkbenchGenerationRecord[];
  login(phone: string, password: string): Promise<Profile | null> | Profile | null;
  loginWorkbenchAccount(phone: string, password: string): Promise<WorkbenchAccount | null> | WorkbenchAccount | null;
  markGenerationCopied(id: string): Promise<GenerationRecord | null> | GenerationRecord | null;
  markWorkbenchGenerationCopied(id: string): Promise<WorkbenchGenerationRecord | null> | WorkbenchGenerationRecord | null;
  updateGenerationNote(id: string, userNote: string): Promise<GenerationRecord | null> | GenerationRecord | null;
  updateStoreProfileSummary(userId: string, profileSummary: string): Promise<StoreProfileRecord | null> | StoreProfileRecord | null;
  updateOpeningApplicationStatus(
    id: string,
    status: OpeningApplicationStatus,
    openedUserId?: string,
  ): Promise<OpeningApplication | null> | OpeningApplication | null;
  updateUserDisabled(id: string, disabled: boolean): Promise<Profile | null> | Profile | null;
  updateUserPassword(id: string, password: string): Promise<Profile | null> | Profile | null;
  extendUserExpiryByDays(id: string, days: number, note: string): Promise<Profile | null> | Profile | null;
  updateWorkbenchAccountDisabled(id: string, disabled: boolean): Promise<WorkbenchAccount | null> | WorkbenchAccount | null;
  updateWorkbenchAccountPassword(id: string, password: string): Promise<WorkbenchAccount | null> | WorkbenchAccount | null;
};

let d1StorePromise: Promise<DataStore> | null = null;

export async function getDataStore(): Promise<DataStore> {
  assertAgentMode();
  const db = await getD1Database();

  if (!db) {
    return mockStore;
  }

  d1StorePromise ??= createD1Store(db);
  return d1StorePromise;
}

async function getD1Database(): Promise<D1DatabaseLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const env = context.env as CloudflareEnv & { DB?: D1DatabaseLike };
    return env.DB ?? null;
  } catch {
    return null;
  }
}
