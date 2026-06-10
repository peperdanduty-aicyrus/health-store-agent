import { describe, expect, it } from "vitest";
import { allSceneKeys } from "./scenes";
import { getPlanConfig } from "./plans";
import { canGenerate, canViewHistory, type PermissionProfile } from "./permissions";

const baseProfile: PermissionProfile = {
  disabled: false,
  expiresAt: "2026-07-10",
  memberStatus: "paid",
  planName: "standard_monthly",
};

describe("membership plan permissions", () => {
  it("allows free trial users to use all six scenes with a daily limit of 5", () => {
    const profile: PermissionProfile = {
      ...baseProfile,
      memberStatus: "trial",
      planName: "free_trial",
    };

    expect(getPlanConfig(profile.planName).dailyLimit).toBe(5);
    expect(allSceneKeys).toHaveLength(6);

    for (const scene of allSceneKeys) {
      expect(canGenerate({ profile, scene, todayCount: 4, today: "2026-06-10" })).toMatchObject({
        allowed: true,
      });
    }
  });

  it("limits basic monthly users to xiaohongshu, moments, and official account with 30 daily generations", () => {
    const profile: PermissionProfile = {
      ...baseProfile,
      planName: "basic_monthly",
    };

    expect(getPlanConfig(profile.planName).dailyLimit).toBe(30);
    expect(canGenerate({ profile, scene: "xiaohongshu", todayCount: 29, today: "2026-06-10" }).allowed).toBe(true);
    expect(canGenerate({ profile, scene: "moments", todayCount: 29, today: "2026-06-10" }).allowed).toBe(true);
    expect(canGenerate({ profile, scene: "official_account", todayCount: 29, today: "2026-06-10" }).allowed).toBe(true);
    expect(canGenerate({ profile, scene: "meituan_dianping", todayCount: 0, today: "2026-06-10" })).toMatchObject({
      allowed: false,
      reason: "plan_locked",
    });
  });

  it("allows standard monthly and internal yearly users to use all scenes with 30 daily generations", () => {
    for (const planName of ["standard_monthly", "internal_yearly"] as const) {
      const profile: PermissionProfile = {
        ...baseProfile,
        planName,
      };

      expect(getPlanConfig(planName).dailyLimit).toBe(30);

      for (const scene of allSceneKeys) {
        expect(canGenerate({ profile, scene, todayCount: 29, today: "2026-06-10" }).allowed).toBe(true);
      }
    }
  });

  it("blocks generation when the daily limit is reached", () => {
    expect(canGenerate({ profile: baseProfile, scene: "xiaohongshu", todayCount: 30, today: "2026-06-10" })).toMatchObject({
      allowed: false,
      reason: "daily_limit_reached",
    });
  });

  it("lets expired users view history but blocks new generation", () => {
    const profile: PermissionProfile = {
      ...baseProfile,
      memberStatus: "expired",
      expiresAt: "2026-06-01",
    };

    expect(canViewHistory(profile)).toBe(true);
    expect(canGenerate({ profile, scene: "xiaohongshu", todayCount: 0, today: "2026-06-10" })).toMatchObject({
      allowed: false,
      reason: "expired",
    });
  });

  it("blocks disabled users from generating", () => {
    const profile: PermissionProfile = {
      ...baseProfile,
      disabled: true,
    };

    expect(canGenerate({ profile, scene: "xiaohongshu", todayCount: 0, today: "2026-06-10" })).toMatchObject({
      allowed: false,
      reason: "disabled",
    });
  });
});
