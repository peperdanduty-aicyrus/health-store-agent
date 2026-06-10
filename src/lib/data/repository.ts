import { mockStore } from "./store";
import { createD1Store, type D1DatabaseLike } from "./store-d1";
import type {
  CreateGenerationInput,
  CreateTrialApplicationInput,
  CreateUserInput,
  GenerationFilter,
  GenerationRecord,
  Profile,
  TrialApplication,
  TrialApplicationStatus,
} from "./types";

export type DataStore = {
  createGeneration(input: CreateGenerationInput): Promise<GenerationRecord> | GenerationRecord;
  createTrialApplication(input: CreateTrialApplicationInput): Promise<TrialApplication> | TrialApplication;
  createUser(input: CreateUserInput): Promise<Profile> | Profile;
  getUserById(id: string): Promise<Profile | null> | Profile | null;
  listApplications(): Promise<TrialApplication[]> | TrialApplication[];
  listGenerations(filter?: GenerationFilter): Promise<GenerationRecord[]> | GenerationRecord[];
  listUsers(): Promise<Profile[]> | Profile[];
  login(phone: string, password: string): Promise<Profile | null> | Profile | null;
  markGenerationCopied(id: string): Promise<GenerationRecord | null> | GenerationRecord | null;
  updateGenerationNote(id: string, userNote: string): Promise<GenerationRecord | null> | GenerationRecord | null;
  updateTrialApplicationStatus(
    id: string,
    status: TrialApplicationStatus,
  ): Promise<TrialApplication | null> | TrialApplication | null;
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
