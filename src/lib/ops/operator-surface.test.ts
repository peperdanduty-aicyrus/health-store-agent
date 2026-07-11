import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("operator surface data isolation", () => {
  it("does not request or render finance and contract data", () => {
    const page = fs.readFileSync("src/app/app/page.tsx", "utf8");
    const actions = fs.readFileSync("src/app/app/ops-actions.ts", "utf8");
    for (const forbidden of ["listPayments", "listAgreements", "monthlyFee", "expectedAmount", "receivedAmount", "settlementDay", "renewalProbability"]) {
      expect(page).not.toContain(forbidden);
      expect(actions).not.toContain(forbidden);
    }
  });

  it("keeps operator mutations limited to assigned tasks, logs, and content profiles", () => {
    const actions = fs.readFileSync("src/app/app/ops-actions.ts", "utf8");
    expect(actions.match(/assertOrganizationAccess/g)?.length).toBe(4);
    expect(actions).not.toContain("savePayment");
    expect(actions).not.toContain("saveAgreement");
    expect(actions).not.toContain("saveSubscription");
  });
});
