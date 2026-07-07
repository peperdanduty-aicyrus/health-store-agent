import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("agent store expansion migration", () => {
  it("is additive and contains only agent account/application changes", () => {
    const sql = readFileSync("migrations-agent/0003_agent_store_expansion.sql", "utf8");
    expect(sql).toContain("ALTER TABLE profiles ADD COLUMN sourceChannel");
    expect(sql).toContain("ALTER TABLE applications ADD COLUMN sourceChannel");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS account_operation_logs");
    expect(sql).not.toMatch(/DROP\s+(TABLE|COLUMN)/i);
    expect(sql).not.toMatch(/survey|yingyun|mall_/i);
  });
});
