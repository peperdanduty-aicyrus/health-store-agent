import { describe, expect, it } from "vitest";
import { isSurveyHost } from "./host";

describe("survey host isolation", () => {
  it("only treats the survey subdomain as the merchant root by default", () => {
    expect(isSurveyHost("survey.81366776.xyz", {})).toBe(true);
    expect(isSurveyHost("survey.81366776.xyz:443", {})).toBe(true);
    expect(isSurveyHost("81366776.xyz", {})).toBe(false);
    expect(isSurveyHost("localhost:3000", {})).toBe(false);
  });

  it("allows local root testing with an explicit environment switch", () => {
    expect(isSurveyHost("localhost:3000", { NEXT_PUBLIC_SURVEY_ENTRY_ENABLED: "true" })).toBe(true);
  });
});
