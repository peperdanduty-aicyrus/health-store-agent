import { describe, expect, it } from "vitest";
import { advanceDemoUsage, demoDailyLimit, getTodayKey, parseDemoUsage, serializeDemoUsage } from "./usage";

describe("demo usage limit", () => {
  it("starts from zero when no cookie exists", () => {
    expect(parseDemoUsage("", "2026-06-12")).toEqual({ count: 0, date: "2026-06-12" });
  });

  it("uses the China calendar day for the automatic date key", () => {
    expect(getTodayKey(new Date("2026-06-11T16:05:00.000Z"))).toBe("2026-06-12");
  });

  it("increments until the daily limit is reached", () => {
    const raw = serializeDemoUsage({ count: demoDailyLimit - 1, date: "2026-06-12" });

    const result = advanceDemoUsage(raw, "2026-06-12");

    expect(result.allowed).toBe(true);
    expect(result.usage).toEqual({ count: demoDailyLimit, date: "2026-06-12" });
    expect(result.remaining).toBe(0);
  });

  it("blocks requests after ten generations in one day", () => {
    const raw = serializeDemoUsage({ count: demoDailyLimit, date: "2026-06-12" });

    const result = advanceDemoUsage(raw, "2026-06-12");

    expect(result.allowed).toBe(false);
    expect(result.usage.count).toBe(demoDailyLimit);
    expect(result.remaining).toBe(0);
  });

  it("resets the counter on a new day", () => {
    const raw = serializeDemoUsage({ count: demoDailyLimit, date: "2026-06-11" });

    const result = advanceDemoUsage(raw, "2026-06-12");

    expect(result.allowed).toBe(true);
    expect(result.usage).toEqual({ count: 1, date: "2026-06-12" });
    expect(result.remaining).toBe(demoDailyLimit - 1);
  });
});
