import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const dbFile = resolve(process.argv[2] || process.env.STAGE3_VERIFY_SQLITE || "backups/multi-site-isolation-20260625-224242/d1/health-store-agent-db.sqlite");
const tables = (process.argv[3] || process.env.STAGE3_VERIFY_TABLES || "").split(",").map((item) => item.trim()).filter(Boolean);

if (!existsSync(dbFile)) {
  throw new Error(`SQLite file not found: ${dbFile}`);
}

const selectedTables = tables.length > 0 ? tables : listTables();
const counts = Object.fromEntries(selectedTables.map((table) => [table, countRows(table)]));
console.log(JSON.stringify({ counts, file: dbFile }, null, 2));

function listTables() {
  return execFileSync("sqlite3", [dbFile, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"], { encoding: "utf8" })
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function countRows(table: string) {
  const output = execFileSync("sqlite3", [dbFile, `SELECT COUNT(*) FROM ${table};`], { encoding: "utf8" }).trim();
  return Number(output);
}

