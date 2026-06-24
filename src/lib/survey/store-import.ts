import { buildStoreSearchText, normalizeStoreSearchText } from "./search";
import type {
  SurveyCategory,
  SurveyImportRow,
  SurveyStore,
  SurveyStoreImportCandidate,
  SurveyStoreImportError,
  SurveyStoreImportResult,
} from "./types";

export const storeImportHeaders = [
  "系统门店ID",
  "品牌名称",
  "店铺名称",
  "店铺编号",
  "楼层",
  "铺位号",
  "所属业态",
  "所属子业态",
  "合同签约时间",
  "合同到期时间",
  "店铺面积",
  "员工人数",
  "店长姓名",
  "联系电话",
  "店铺经营模式",
  "是否连锁",
  "负责营运人员",
  "租金方式",
  "搜索别名",
];

export function parseStoreImportText(text: string): SurveyImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = parseDelimitedLine(lines[0], delimiter);
  return lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export function validateStoreImportRows(
  rows: SurveyImportRow[],
  context: {
    categories: SurveyCategory[];
    existingStores: SurveyStore[];
    mallId: string;
  },
): SurveyStoreImportResult {
  const validRows: SurveyStoreImportCandidate[] = [];
  const errorRows: SurveyStoreImportError[] = [];
  const categoriesByName = new Map(context.categories.map((category) => [category.name, category]));
  const existingKeys = new Set(context.existingStores.map((store) => storeIdentityKey(store.brandName, store.floor, store.unitNo)));
  const seenKeys = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const categoryName = read(row, "所属业态");
    const category = categoriesByName.get(categoryName);
    if (!category) {
      errorRows.push({ reason: `业态不存在：${categoryName || "空"}`, row, rowNumber });
      return;
    }

    const brandName = read(row, "品牌名称");
    const storeName = read(row, "店铺名称") || brandName;
    const floor = read(row, "楼层");
    const unitNo = read(row, "铺位号");
    if (!brandName || !floor || !unitNo) {
      errorRows.push({ reason: "品牌名称、楼层和铺位号不能为空。", row, rowNumber });
      return;
    }

    const key = storeIdentityKey(brandName, floor, unitNo);
    if ((existingKeys.has(key) && !read(row, "系统门店ID")) || seenKeys.has(key)) {
      errorRows.push({ reason: `重复门店：${brandName} ${floor}-${unitNo}`, row, rowNumber });
      return;
    }

    seenKeys.add(key);
    validRows.push({
      aliases: splitAliases(read(row, "搜索别名")),
      areaSqm: readNumber(row, "店铺面积"),
      brandName,
      categoryName: category.name,
      chainStore: parseBoolean(read(row, "是否连锁")),
      contactPhone: read(row, "联系电话"),
      contractEndDate: read(row, "合同到期时间"),
      contractStartDate: read(row, "合同签约时间"),
      displayLocation: `${floor}-${unitNo}`,
      floor,
      managerName: read(row, "店长姓名"),
      operationMode: read(row, "店铺经营模式"),
      operatorName: read(row, "负责营运人员"),
      rentMode: read(row, "租金方式"),
      staffCount: readNumber(row, "员工人数"),
      storeCode: read(row, "店铺编号"),
      storeId: read(row, "系统门店ID"),
      storeName,
      subcategoryName: read(row, "所属子业态"),
      unitNo,
    });
  });

  return { errorRows, validRows };
}

export function buildStoreImportTemplateCsv(): string {
  return `${storeImportHeaders.join(",")}\n${[
    "",
    "Little MO&Co.",
    "Little MO&Co. Kids",
    "MO-305",
    "L3",
    "305",
    "儿童鞋服",
    "",
    "2026-01-01",
    "2027-12-31",
    "92",
    "7",
    "张店长",
    "13800000001",
    "直营",
    "是",
    "营运一组",
    "固定租金",
    "little mo;mo&co;小MO",
  ].join(",")}`;
}

export function buildCandidateSearchText(candidate: SurveyStoreImportCandidate): string {
  return buildStoreSearchText({
    aliases: candidate.aliases,
    brandName: candidate.brandName,
    storeName: candidate.storeName,
  });
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  if (delimiter === "\t") {
    return line.split("\t").map((value) => value.trim());
  }

  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function read(row: SurveyImportRow, key: string): string {
  return String(row[key] || "").trim();
}

function readNumber(row: SurveyImportRow, key: string): number {
  const value = Number(read(row, key));
  return Number.isFinite(value) ? value : 0;
}

function splitAliases(value: string): string[] {
  return value
    .split(/[;；、|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value: string): boolean {
  return ["是", "true", "yes", "1", "连锁"].includes(value.trim().toLowerCase());
}

function storeIdentityKey(brandName: string, floor: string, unitNo: string): string {
  return `${normalizeStoreSearchText(brandName)}:${normalizeStoreSearchText(floor)}:${normalizeStoreSearchText(unitNo)}`;
}
