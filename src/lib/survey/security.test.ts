import { describe, expect, it } from "vitest";
import { applySurveyTermPreset, canOpenNewSurveyPeriod, isSurveyAccountActive } from "./access";
import { hashSurveyPassword, verifySurveyPassword } from "./password";

describe("survey staff security", () => {
  it("stores staff passwords as verifiable hashes instead of plain text", async () => {
    const hash = await hashSurveyPassword("SurveyAdmin@2026", "fixed-survey-salt");

    expect(hash).not.toBe("SurveyAdmin@2026");
    expect(hash).toMatch(/^pbkdf2_sha256\$/);
    await expect(verifySurveyPassword("SurveyAdmin@2026", hash)).resolves.toBe(true);
    await expect(verifySurveyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("keeps expired operators able to view history but blocks opening new periods", () => {
    const expiredOperator = {
      enabled: true,
      expiresAt: "2026-05-31",
      startsAt: "2026-01-01",
    };

    expect(isSurveyAccountActive(expiredOperator, new Date("2026-06-23T00:00:00.000Z"))).toBe(false);
    expect(canOpenNewSurveyPeriod(expiredOperator, new Date("2026-06-23T00:00:00.000Z"))).toBe(false);
  });

  it("calculates 3, 6, and 12 month permission presets from custom starts", () => {
    expect(applySurveyTermPreset("2026-06-01", 3)).toEqual({
      startsAt: "2026-06-01",
      expiresAt: "2026-08-31",
    });
    expect(applySurveyTermPreset("2026-06-01", 6).expiresAt).toBe("2026-11-30");
    expect(applySurveyTermPreset("2026-06-01", 12).expiresAt).toBe("2027-05-31");
  });
});
