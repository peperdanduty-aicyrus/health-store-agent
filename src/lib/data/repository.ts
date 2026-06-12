import { mockStore } from "./store";
import { createD1Store, type D1DatabaseLike } from "./store-d1";
import type {
  CreateGenerationInput,
  CreateOpeningApplicationInput,
  CreateUserInput,
  GenerationFilter,
  GenerationRecord,
  Profile,
  OpeningApplication,
  OpeningApplicationStatus,
} from "./types";

export type DataStore = {
  createGeneration(input: CreateGenerationInput): Promise<GenerationRecord> | GenerationRecord;
  createOpeningApplication(input: CreateOpeningApplicationInput): Promise<OpeningApplication> | OpeningApplication;
  createUser(input: CreateUserInput): Promise<Profile> | Profile;
  getGenerationById(id: string): Promise<GenerationRecord | null> | GenerationRecord | null;
  getUserById(id: string): Promise<Profile | null> | Profile | null;
  listApplications(): Promise<OpeningApplication[]> | OpeningApplication[];
  listGenerations(filter?: GenerationFilter): Promise<GenerationRecord[]> | GenerationRecord[];
  listUsers(): Promise<Profile[]> | Profile[];
  login(phone: string, password: string): Promise<Profile | null> | Profile | null;
  markGenerationCopied(id: string): Promise<GenerationRecord | null> | GenerationRecord | null;
  updateGenerationNote(id: string, userNote: string): Promise<GenerationRecord | null> | GenerationRecord | null;
  updateOpeningApplicationStatus(
    id: string,
    status: OpeningApplicationStatus,
    openedUserId?: string,
  ): Promise<OpeningApplication | null> | OpeningApplication | null;
  updateUserDisabled(id: string, disabled: boolean): Promise<Profile | null> | Profile | null;
  updateUserPassword(id: string, password: string): Promise<Profile | null> | Profile | null;
};

let d1StorePromise: Promise<DataStore> | null = null;

export async function getDataStore(): Promise<DataStore> {
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
