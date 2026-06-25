import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildDefaultSurveyFormFieldRecords } from "../../src/lib/survey/merchant-form";
import { hashSurveyPassword } from "../../src/lib/survey/password";
import { finalSurveyStoreRows, formCategoryNameByCode, splitFinalStoreAliases, withdrawnStoreNames } from "../../src/lib/survey/real-store-data";
import { buildStoreSearchText, normalizeStoreSearchText } from "../../src/lib/survey/search";
import { defaultSurveyCategoryNames } from "../../src/lib/survey/store";
import type { SurveyCategory } from "../../src/lib/survey/types";

const mallId = process.env.SURVEY_REMOTE_MALL_ID || "survey_mall_001";
const mallName = process.env.SURVEY_REMOTE_MALL_NAME || "第一版测试商场";
const timestamp = "2026-06-24T00:00:00.000Z";
const outFile = resolve(process.env.STAGE6_REMOTE_SEED_SQL || "/tmp/health-store-agent-stage6-formal-seed.sql");

const categoryRows = defaultSurveyCategoryNames.map((name, index) => ({
  createdAt: timestamp,
  enabled: true,
  id: `survey_category_${String(index + 1).padStart(3, "0")}`,
  mallId,
  name,
  sortOrder: index + 1,
  updatedAt: timestamp,
})) satisfies SurveyCategory[];

const categoryIdByName = new Map(categoryRows.map((item) => [item.name, item.id]));
const categoryIdByCode = new Map(Object.entries(formCategoryNameByCode).map(([code, name]) => [code, categoryIdByName.get(name) || "survey_category_001"]));
const subcategoryMappings = [
  ["3C数码", "DIGITAL_3C"],
  ["儿童鞋服", "KIDS_FASHION"],
  ["儿童用品", "KIDS_PRODUCTS"],
  ["家电", "HOME_APPLIANCE"],
  ["家用精品", "HOME_APPLIANCE"],
  ["日用杂货", "HOME_APPLIANCE"],
  ["美妆护肤", "BEAUTY_HEALTH"],
  ["儿童游乐", "KIDS_ENTERTAINMENT"],
  ["教培", "EDUCATION"],
] as const;

const brandNames = Array.from(new Set([...finalSurveyStoreRows.map((row) => row.brandName), ...withdrawnStoreNames]));
const brandIdByName = new Map(brandNames.map((name, index) => [name, `survey_brand_${String(index + 1).padStart(3, "0")}`]));

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const lines: string[] = [
    "-- Stage 6 formal D1 seed. Run after migrations 0001 through 0007.",
    "-- This file intentionally contains no plaintext passwords or API secrets.",
    "BEGIN TRANSACTION;",
    insertOrReplace("survey_malls", ["id", "name", "status", "created_at", "updated_at"], [mallId, mallName, "active", timestamp, timestamp]),
  ];

  for (const category of categoryRows) {
    lines.push(insertOrReplace("survey_business_categories", ["id", "mall_id", "name", "sort_order", "enabled", "created_at", "updated_at"], [
      category.id,
      category.mallId,
      category.name,
      category.sortOrder,
      1,
      category.createdAt,
      category.updatedAt,
    ]));
  }

  for (const [index, [subcategoryName, formCategoryCode]] of subcategoryMappings.entries()) {
    const subcategoryId = `survey_subcategory_${String(index + 1).padStart(3, "0")}`;
    const formCategoryName = formCategoryNameByCode[formCategoryCode];
    lines.push(insertOrReplace("survey_business_subcategories", ["id", "mall_id", "category_id", "name", "sort_order", "enabled", "created_at", "updated_at"], [
      subcategoryId,
      mallId,
      categoryIdByCode.get(formCategoryCode) || "survey_category_001",
      subcategoryName,
      index + 1,
      1,
      timestamp,
      timestamp,
    ]));
    lines.push(insertOrReplace("survey_subcategory_form_mappings", ["id", "mall_id", "subcategory_name", "form_category_code", "form_category_name", "enabled", "sort_order", "created_at", "updated_at"], [
      `survey_subcategory_mapping_${String(index + 1).padStart(3, "0")}`,
      mallId,
      subcategoryName,
      formCategoryCode,
      formCategoryName,
      1,
      index + 1,
      timestamp,
      timestamp,
    ]));
  }

  for (const field of buildDefaultSurveyFormFieldRecords(mallId, categoryRows)) {
    lines.push(insertOrReplace("survey_form_fields", [
    "id",
    "mall_id",
    "category_id",
    "field_key",
    "label",
    "type",
    "required",
    "unit",
    "precision",
    "options_json",
    "visible_rule_json",
    "sort_order",
    "enabled",
    "created_at",
    "updated_at",
  ], [
    field.id,
    field.mallId,
    field.categoryId,
    field.fieldKey,
    field.label,
    field.type,
    field.required ? 1 : 0,
    field.unit,
    field.precision,
    field.optionsJson,
    field.visibleRuleJson,
    field.sortOrder,
    field.enabled ? 1 : 0,
    field.createdAt,
    field.updatedAt,
    ]));
  }

  for (const brandName of brandNames) {
    lines.push(insertOrReplace("survey_brands", ["id", "mall_id", "name", "normalized_name", "created_at", "updated_at"], [
      brandIdByName.get(brandName),
      mallId,
      brandName,
      normalizeStoreSearchText(brandName),
      timestamp,
      timestamp,
    ]));
  }

  for (const [index, row] of finalSurveyStoreRows.entries()) {
    const formCategoryName = formCategoryNameByCode[row.formCategoryCode] || row.subcategoryName;
    const aliases = splitFinalStoreAliases(row.searchAliases);
    const subcategoryIndex = subcategoryMappings.findIndex(([name]) => name === row.subcategoryName);
    const storeId = `survey_store_${String(index + 1).padStart(3, "0")}`;
    lines.push(insertOrReplace("survey_stores", [
    "id",
    "mall_id",
    "mall_name",
    "brand_id",
    "brand_name",
    "store_name",
    "store_code",
    "floor",
    "unit_no",
    "display_location",
    "category_id",
    "category_name",
    "form_category_code",
    "subcategory_id",
    "subcategory_name",
    "contract_start_date",
    "contract_end_date",
    "area_sqm",
    "staff_count",
    "manager_name",
    "contact_phone",
    "operation_mode",
    "chain_store",
    "operator_name",
    "rent_mode",
    "status",
    "search_text",
    "created_at",
    "updated_at",
  ], [
    storeId,
    mallId,
    mallName,
    brandIdByName.get(row.brandName),
    row.brandName,
    row.brandName,
    row.storeNo,
    row.floorUnit,
    "",
    row.floorUnit,
    categoryIdByCode.get(row.formCategoryCode) || "survey_category_001",
    formCategoryName,
    row.formCategoryCode,
    subcategoryIndex >= 0 ? `survey_subcategory_${String(subcategoryIndex + 1).padStart(3, "0")}` : "",
    row.subcategoryName,
    "",
    "",
    row.areaSqm,
    row.staffCount,
    "",
    "",
    "",
    0,
    "",
    "",
    "active",
    buildStoreSearchText({ aliases, brandName: row.brandName, storeName: row.brandName }),
    timestamp,
    timestamp,
    ]));
    for (const [aliasIndex, alias] of aliases.entries()) {
      lines.push(insertOrReplace("survey_store_aliases", ["id", "store_id", "alias", "normalized_alias", "created_at"], [
        `survey_alias_${String(index + 1).padStart(3, "0")}_${String(aliasIndex + 1).padStart(2, "0")}`,
        storeId,
        alias,
        normalizeStoreSearchText(alias),
        timestamp,
      ]));
    }
  }

  for (const [index, brandName] of withdrawnStoreNames.entries()) {
    lines.push(insertOrReplace("survey_stores", [
    "id",
    "mall_id",
    "mall_name",
    "brand_id",
    "brand_name",
    "store_name",
    "store_code",
    "floor",
    "unit_no",
    "display_location",
    "category_id",
    "category_name",
    "form_category_code",
    "subcategory_id",
    "subcategory_name",
    "contract_start_date",
    "contract_end_date",
    "area_sqm",
    "staff_count",
    "manager_name",
    "contact_phone",
    "operation_mode",
    "chain_store",
    "operator_name",
    "rent_mode",
    "status",
    "search_text",
    "created_at",
    "updated_at",
  ], [
    `survey_store_archived_${String(index + 1).padStart(3, "0")}`,
    mallId,
    mallName,
    brandIdByName.get(brandName),
    brandName,
    brandName,
    `ARCHIVED-${index + 1}`,
    "",
    "",
    "已撤店",
    "survey_category_001",
    "3C数码",
    "ARCHIVED",
    "",
    "已撤店",
    "",
    "",
    0,
    0,
    "",
    "",
    "",
    0,
    "",
    "",
    "archived",
    buildStoreSearchText({ aliases: [], brandName, storeName: brandName }),
    timestamp,
    timestamp,
    ]));
  }

  await appendBootstrapStaffSql(lines);

  lines.push("COMMIT;", "");

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, lines.join("\n"));

  console.log(JSON.stringify({
    file: outFile,
    fields: 73,
    formalStores: finalSurveyStoreRows.length,
    includesPlaintextPasswords: false,
    mappings: subcategoryMappings.length,
    withdrawnStores: withdrawnStoreNames.length,
  }, null, 2));
}

async function appendBootstrapStaffSql(sqlLines: string[]) {
  const adminPassword = process.env.SURVEY_BOOTSTRAP_ADMIN_PASSWORD;
  const operatorPassword = process.env.SURVEY_BOOTSTRAP_OPERATOR_PASSWORD;
  if (!adminPassword || !operatorPassword) {
    sqlLines.push("-- Staff accounts skipped: set SURVEY_BOOTSTRAP_ADMIN_PASSWORD and SURVEY_BOOTSTRAP_OPERATOR_PASSWORD locally before generating if remote login accounts are required.");
    return;
  }
  const adminLogin = process.env.SURVEY_BOOTSTRAP_ADMIN_LOGIN || "cyrus_admin";
  const operatorLogin = process.env.SURVEY_BOOTSTRAP_OPERATOR_LOGIN || "yingyun01";
  sqlLines.push(insertOrReplace("survey_staff_accounts", [
    "id",
    "mall_id",
    "login_name",
    "phone",
    "password_hash",
    "role",
    "display_name",
    "enabled",
    "starts_at",
    "expires_at",
    "created_at",
    "updated_at",
  ], [
    "survey_staff_bootstrap_admin",
    mallId,
    adminLogin,
    "",
    await hashSurveyPassword(adminPassword),
    "super_admin",
    "总管理员",
    1,
    "2026-06-24",
    "2027-06-24",
    timestamp,
    timestamp,
  ]));
  sqlLines.push(insertOrReplace("survey_staff_accounts", [
    "id",
    "mall_id",
    "login_name",
    "phone",
    "password_hash",
    "role",
    "display_name",
    "enabled",
    "starts_at",
    "expires_at",
    "created_at",
    "updated_at",
  ], [
    "survey_staff_bootstrap_operator",
    mallId,
    operatorLogin,
    "",
    await hashSurveyPassword(operatorPassword),
    "operator",
    "营运账号",
    1,
    "2026-06-24",
    "2027-06-24",
    timestamp,
    timestamp,
  ]));
}

function insertOrReplace(table: string, columns: string[], values: unknown[]) {
  return `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${values.map(sqlValue).join(", ")});`;
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}
