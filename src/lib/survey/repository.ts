import { createSeededSurveyMemoryStore, createSurveyMemoryStore } from "./store";
import { createLocalSurveyD1Database } from "./local-d1";
import { createSurveyD1Store, type SurveyD1DatabaseLike } from "./store-d1";
import { assertSurveyMode } from "../app-mode";

export type SurveyStoreRepository = ReturnType<typeof createSurveyMemoryStore>;

const globalForSurveyStore = globalThis as typeof globalThis & {
  __surveyD1Store?: Promise<SurveyStoreRepository>;
  __surveyMemoryStore?: Promise<SurveyStoreRepository>;
};

export async function getSurveyStore(): Promise<SurveyStoreRepository> {
  assertSurveyMode();
  const db = await getSurveyD1Database();
  if (db) {
    globalForSurveyStore.__surveyD1Store ??= createSurveyD1Store(db) as Promise<SurveyStoreRepository>;
    return globalForSurveyStore.__surveyD1Store;
  }
  globalForSurveyStore.__surveyMemoryStore ??= createSeededSurveyMemoryStore();
  return globalForSurveyStore.__surveyMemoryStore;
}

async function getSurveyD1Database(): Promise<SurveyD1DatabaseLike | null> {
  if (process.env.SURVEY_USE_MEMORY_STORE !== "true") {
    const localDb = createLocalSurveyD1Database();
    if (localDb) {
      return localDb;
    }
  }
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const env = context.env as CloudflareEnv & { DB?: SurveyD1DatabaseLike };
    return env.DB ?? null;
  } catch {
    return null;
  }
}
