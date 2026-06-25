import { describe, expect, it } from "vitest";
import { filterPublicSurveyStores, getSurveyPilotStoreCodes, getSurveyPublicAccessMode, isPublicSurveyStoreAllowed, stage6PilotStoreCodes } from "./pilot";

const activeStore = { id: "store-1", status: "active" as const, storeCode: "L0149N01" };
const otherActiveStore = { id: "store-2", status: "active" as const, storeCode: "B0105N01" };

describe("stage 6 public survey pilot access", () => {
  it("keeps all active stores visible unless pilot mode is explicitly enabled", () => {
    expect(getSurveyPublicAccessMode({})).toBe("all");
    expect(isPublicSurveyStoreAllowed(otherActiveStore, {})).toBe(true);
  });

  it("uses the eight-store pilot list when production pilot mode is enabled", () => {
    expect(stage6PilotStoreCodes).toHaveLength(8);
    expect(getSurveyPilotStoreCodes({ SURVEY_PUBLIC_ACCESS_MODE: "pilot" })).toEqual(stage6PilotStoreCodes);
    expect(isPublicSurveyStoreAllowed(activeStore, { SURVEY_PUBLIC_ACCESS_MODE: "pilot" })).toBe(true);
    expect(isPublicSurveyStoreAllowed(otherActiveStore, { SURVEY_PUBLIC_ACCESS_MODE: "pilot" })).toBe(false);
  });

  it("supports an explicit pilot code override and never exposes inactive stores", () => {
    const env = { SURVEY_PUBLIC_ACCESS_MODE: "pilot", SURVEY_PILOT_STORE_CODES: "A001; A002" };
    expect(getSurveyPilotStoreCodes(env)).toEqual(["A001", "A002"]);
    expect(filterPublicSurveyStores([{ id: "a", status: "active" as const, storeCode: "A001" }, { id: "b", status: "archived" as const, storeCode: "A002" }], env)).toEqual([
      { id: "a", status: "active", storeCode: "A001" },
    ]);
  });
});
