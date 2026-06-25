import type { SurveyStore } from "./types";

export const stage6PilotStoreCodes = [
  "L0149N01",
  "L0126N002",
  "L0409N01",
  "L0467N01",
  "L0476N02",
  "B0176N01",
  "L0323N03",
  "L0315N01",
];

type PilotEnv = Record<string, string | undefined> & {
  SURVEY_PILOT_STORE_CODES?: string;
  SURVEY_PUBLIC_ACCESS_MODE?: string;
};

export function getSurveyPublicAccessMode(env: PilotEnv = process.env): "all" | "pilot" {
  return env.SURVEY_PUBLIC_ACCESS_MODE === "pilot" ? "pilot" : "all";
}

export function getSurveyPilotStoreCodes(env: PilotEnv = process.env): string[] {
  const configured = String(env.SURVEY_PILOT_STORE_CODES || "")
    .split(/[,\n;；，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : stage6PilotStoreCodes;
}

export function isPublicSurveyStoreAllowed(store: Pick<SurveyStore, "storeCode" | "status">, env: PilotEnv = process.env): boolean {
  if (store.status !== "active") {
    return false;
  }
  if (getSurveyPublicAccessMode(env) === "all") {
    return true;
  }
  return new Set(getSurveyPilotStoreCodes(env)).has(store.storeCode);
}

export function filterPublicSurveyStores<T extends Pick<SurveyStore, "id" | "status" | "storeCode">>(stores: T[], env: PilotEnv = process.env): T[] {
  return stores.filter((store) => isPublicSurveyStoreAllowed(store, env));
}
