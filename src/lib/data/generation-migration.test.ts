import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("agent generation safety migration", () => {
  it("only adds the diagnostic columns without destructive SQL", () => {
    const sql = readFileSync(resolve(process.cwd(), "migrations-agent/0002_agent_generation_safety.sql"), "utf8");

    for (const column of [
      "status",
      "raw_response",
      "cleaned_content",
      "error_code",
      "error_message",
      "request_id",
      "finish_reason",
      "token_usage",
      "elapsed_ms",
      "prompt_version",
    ]) {
      expect(sql).toMatch(new RegExp(`ADD COLUMN ${column}\\b`, "i"));
    }
    expect(sql).not.toMatch(/\b(?:DROP|DELETE|UPDATE|INSERT|RENAME)\b/i);
  });
});
