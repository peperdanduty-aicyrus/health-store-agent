import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("operator surface data isolation", () => {
  it("does not request or render finance and contract data", () => {
    const page = fs.readFileSync("src/app/app/page.tsx", "utf8");
    const actions = fs.readFileSync("src/app/app/ops-actions.ts", "utf8");
    const contentActions = fs.readFileSync("src/app/app/content-actions.ts", "utf8");
    for (const forbidden of ["listPayments", "listAgreements", "monthlyFee", "expectedAmount", "receivedAmount", "settlementDay", "renewalProbability", "monthly_fee", "expected_amount", "paid_amount"]) {
      expect(page).not.toContain(forbidden);
      expect(actions).not.toContain(forbidden);
      expect(contentActions).not.toContain(forbidden);
    }
  });

  it("keeps operator mutations limited to assigned tasks, logs, and content profiles", () => {
    const actions = fs.readFileSync("src/app/app/ops-actions.ts", "utf8");
    expect(actions.match(/assertOrganizationAccess/g)?.length).toBe(4);
    expect(actions).not.toContain("savePayment");
    expect(actions).not.toContain("saveAgreement");
    expect(actions).not.toContain("saveSubscription");
  });

  it("keeps finance routes and mutations behind the owner-only server guard", () => {
    const revenuePage = fs.readFileSync("src/app/lvminglei/revenue/page.tsx", "utf8");
    const ownerActions = fs.readFileSync("src/app/lvminglei/actions.ts", "utf8");
    expect(revenuePage).toContain("requireWorkbenchOwner");
    expect(ownerActions).toMatch(/export async function saveOpsAgreement[\s\S]*?requireWorkbenchOwner/);
    expect(ownerActions).toMatch(/export async function saveOpsPayment[\s\S]*?requireWorkbenchOwner/);
  });

  it("passes only a server-validated assigned organization into operator generation", () => {
    const page = fs.readFileSync("src/app/app/page.tsx", "utf8");
    const generateAction = fs.readFileSync("src/app/actions.ts", "utf8");
    expect(page).toContain("organizationId");
    expect(generateAction).toContain("assertOrganizationAccess");
    expect(generateAction).toContain("profile.storeType === \"运营人员\"");
  });

  it("validates the assigned organization again for content task and draft mutations", () => {
    const actions = fs.readFileSync("src/app/app/content-actions.ts", "utf8");
    expect(actions.match(/assertOrganizationAccess/g)?.length).toBeGreaterThanOrEqual(1);
    expect(actions).toContain("requireUser");
    expect(actions).toContain("getContentDraft");
  });
});
