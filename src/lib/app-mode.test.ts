import { describe, expect, it } from "vitest";
import { canAccessPath, getAgentCyrusRedirectPath, getAppMetadata, getAppMode, shouldRedirectAgentCyrus } from "./app-mode";

describe("app mode isolation", () => {
  it("parses known modes and defaults local development to mixed", () => {
    expect(getAppMode("agent")).toBe("agent");
    expect(getAppMode("survey")).toBe("survey");
    expect(getAppMode("")).toBe("mixed");
  });

  it("blocks survey routes in agent mode", () => {
    expect(canAccessPath("/survey", "agent")).toBe(false);
    expect(canAccessPath("/survey/submit", "agent")).toBe(false);
    expect(canAccessPath("/yingyun/pos", "agent")).toBe(false);
    expect(canAccessPath("/api/survey/store-template", "agent")).toBe(false);
    expect(canAccessPath("/agent-admin/users", "agent")).toBe(true);
  });

  it("blocks agent routes in survey mode", () => {
    expect(canAccessPath("/login", "survey")).toBe(false);
    expect(canAccessPath("/app/history", "survey")).toBe(false);
    expect(canAccessPath("/agent-admin", "survey")).toBe(false);
    expect(canAccessPath("/lvminglei", "survey")).toBe(false);
    expect(canAccessPath("/survey", "survey")).toBe(true);
    expect(canAccessPath("/cyrus", "survey")).toBe(true);
  });

  it("keeps cyrus as survey admin and redirects only in agent mode", () => {
    expect(shouldRedirectAgentCyrus("/cyrus", "agent")).toBe(true);
    expect(shouldRedirectAgentCyrus("/cyrus/users", "agent")).toBe(true);
    expect(getAgentCyrusRedirectPath("/cyrus/users")).toBe("/agent-admin/users");
    expect(shouldRedirectAgentCyrus("/cyrus", "survey")).toBe(false);
    expect(canAccessPath("/cyrus/users", "survey")).toBe(false);
  });

  it("returns system-specific metadata", () => {
    expect(getAppMetadata("agent").title).toContain("获客文案助手");
    expect(getAppMetadata("survey").title).toBe("商场经营调研系统");
  });
});
