import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const sourceDb = resolve(process.env.STAGE3_SOURCE_SQLITE || "backups/multi-site-isolation-20260625-224242/d1/health-store-agent-db.sqlite");
const outFile = resolve(process.env.STAGE3_SURVEY_FOUNDATION_SQL || "artifacts/stage3/survey-foundation.sql");
const foundationTables = [
  "survey_malls",
  "survey_staff_accounts",
  "survey_brands",
  "survey_business_categories",
  "survey_business_subcategories",
  "survey_subcategory_form_mappings",
  "survey_stores",
  "survey_store_aliases",
  "survey_form_fields",
];

const smokeTables = [
  "survey_merchant_submissions",
  "survey_city_peer_store_sales",
  "survey_pos_sales",
  "survey_pos_sale_details",
  "survey_monthly_store_metrics",
  "survey_monthly_metric_snapshots",
  "survey_warning_records",
  "survey_follow_up_records",
  "survey_follow_up_details",
  "survey_ai_report_jobs",
  "survey_report_snapshots",
  "survey_reports",
  "survey_report_versions",
  "survey_audit_logs",
];

main();

function main() {
  if (!existsSync(sourceDb)) {
    throw new Error(`Source SQLite backup not found: ${sourceDb}`);
  }
  const lines = [
    "-- Stage 3 Survey foundation copy.",
    "-- Includes foundation/config/account rows only. Smoke business data is intentionally excluded.",
    "BEGIN TRANSACTION;",
  ];
  for (const table of foundationTables) {
    lines.push(`DELETE FROM ${table};`);
    lines.push(dumpTable(table).trim());
  }
  lines.push("COMMIT;", "");
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, lines.filter(Boolean).join("\n"));
  console.log(JSON.stringify({ excludedSmokeTables: smokeTables, file: outFile, source: sourceDb, tables: foundationTables }, null, 2));
}

function dumpTable(table: string) {
  return execFileSync("sqlite3", [sourceDb, `.mode insert ${table}\nSELECT * FROM ${table};`], { encoding: "utf8" });
}

