import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const sourceDb = resolve(process.env.STAGE3_SOURCE_SQLITE || "backups/multi-site-isolation-20260625-224242/d1/health-store-agent-db.sqlite");
const outFile = resolve(process.env.STAGE3_AGENT_DATA_SQL || "artifacts/stage3/agent-data.sql");
const tables = ["profiles", "applications", "generations", "store_profiles", "workbench_accounts", "workbench_generations"];

main();

function main() {
  if (!existsSync(sourceDb)) {
    throw new Error(`Source SQLite backup not found: ${sourceDb}`);
  }
  const lines = [
    "-- Stage 3 Agent data copy.",
    "-- Contains Agent business data only; no Survey tables are included.",
    "BEGIN TRANSACTION;",
  ];
  for (const table of tables) {
    lines.push(`DELETE FROM ${table};`);
    lines.push(dumpTable(table).trim());
  }
  lines.push("COMMIT;", "");
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, lines.filter(Boolean).join("\n"));
  console.log(JSON.stringify({ file: outFile, source: sourceDb, tables }, null, 2));
}

function dumpTable(table: string) {
  return execFileSync("sqlite3", ["-cmd", `.mode insert ${table}`, sourceDb, `SELECT * FROM ${table};`], { encoding: "utf8" });
}
