import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(process.cwd(), "migrations-agent/0004_agent_ops_control_center_phase1.sql");
const contentMigrationPath = path.resolve(process.cwd(), "migrations-agent/0005_agent_content_center_phase2a.sql");

describe("Agent operations migration", () => {
  const sql = fs.readFileSync(migrationPath, "utf8");

  it("creates every required ops table additively", () => {
    for (const table of [
      "ops_clients",
      "ops_organizations",
      "ops_service_agreements",
      "ops_tasks",
      "ops_task_logs",
      "ops_payments",
      "ops_subscriptions",
      "ops_operator_assignments",
      "ops_content_profiles",
      "ops_reports",
    ]) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it("does not delete, rename, drop, or overwrite legacy schema", () => {
    expect(sql).not.toMatch(/\bDROP\b/i);
    expect(sql).not.toMatch(/\bDELETE\b/i);
    expect(sql).not.toMatch(/\bALTER\s+TABLE\b/i);
    expect(sql).not.toMatch(/\bRENAME\b/i);
    expect(sql).not.toMatch(/\bINSERT\b/i);
    expect(sql).not.toMatch(/\bUPDATE\b/i);
  });
});

describe("content production migration", () => {
  const sql = fs.readFileSync(contentMigrationPath, "utf8");
  it("adds the six content tables without destructive statements", () => {
    for (const table of ["ops_content_tasks", "ops_content_drafts", "ops_content_versions", "ops_content_generation_runs", "ops_style_samples", "ops_keywords"]) expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    expect(sql).not.toMatch(/\b(DROP|DELETE|ALTER\s+TABLE|RENAME|INSERT|UPDATE)\b/i);
  });
});
