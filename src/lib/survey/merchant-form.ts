import { mapDictionaryTypeToFieldType, surveyFieldDictionary, surveyOptionDictionary } from "./field-dictionary";
import type { SurveyCategory, SurveyPeerSalesRow, SurveyStoredFormField } from "./types";

export type SurveyFieldType = "checkbox" | "multiselect" | "number" | "radio" | "textarea" | "text";

export type SurveyFieldDefinition = {
  categoryCode?: string;
  helpText?: string;
  key: string;
  label: string;
  maxSelections?: number;
  maxValue?: number;
  minSelections?: number;
  minValue?: number;
  module?: string;
  options?: string[];
  precision?: number;
  requiredRule?: string;
  required: boolean;
  type: SurveyFieldType;
  unit?: string;
  validationText?: string;
  visibleRule?: string;
};

export type SurveyPeriodInfo = {
  isLate: boolean;
  normalFillEndsAt: string;
  periodMonth: string;
};

const broadExcusePatterns = ["大环境不好", "商场客流下降", "商场活动不给力", "店铺位置不好", "天气不好", "消费降级"];

export const businessReviewOptions = ["明显提升", "小幅提升", "基本持平", "小幅下降", "明显下降"];

export const salesReasonOptions = [
  "主推商品或项目表现较好",
  "新品带动销售",
  "员工销售能力提升",
  "客单价提升",
  "连带率提升",
  "会员复购增加",
  "活动执行效果较好",
  "库存结构改善",
  "陈列调整有效",
  "店铺服务改善",
  "私域或社群转化增加",
  "主推商品或项目表现较弱",
  "缺货或库存结构不合理",
  "新品不足",
  "员工不足或人员变动",
  "员工销售能力下降",
  "客单价下降",
  "连带率下降",
  "会员复购下降",
  "活动执行不到位",
  "陈列需要调整",
  "服务或转化能力下降",
  "其他店内原因",
];

export function getCurrentSurveyPeriod(now = new Date()): SurveyPeriodInfo {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const previous = new Date(Date.UTC(year, month - 1, 1));
  const normalFillEnds = new Date(Date.UTC(year, month, 8));
  return {
    isLate: now.getUTCDate() >= 9,
    normalFillEndsAt: normalFillEnds.toISOString().slice(0, 10),
    periodMonth: previous.toISOString().slice(0, 7),
  };
}

export function getSurveyFieldDefinitionsForCategory(categoryName: string): SurveyFieldDefinition[] {
  const code = categoryNameToCode(categoryName);
  return surveyFieldDictionary
    .filter((field) => field.enabled && (field.categoryCode === "COMMON" || field.categoryCode === code))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((field) => dictionaryFieldToDefinition(field));
}

export function buildDefaultSurveyFormFieldRecords(mallId: string, _categories: Pick<SurveyCategory, "id" | "mallId" | "name">[]): SurveyStoredFormField[] {
  const timestamp = "2026-06-23T00:00:00.000Z";
  return surveyFieldDictionary
    .filter((field) => field.enabled)
    .map((field) => toStoredField(dictionaryFieldToDefinition(field), {
      categoryId: field.categoryCode === "COMMON" ? null : field.categoryCode,
      id: `survey_field_${field.categoryCode.toLowerCase()}_${field.fieldKey}`,
      mallId,
      sortOrder: field.sortOrder,
      timestamp,
    }));
}

export function surveyStoredFormFieldToDefinition(field: SurveyStoredFormField): SurveyFieldDefinition {
  const type = ["checkbox", "multiselect", "number", "radio", "textarea", "text"].includes(field.type)
    ? (field.type as SurveyFieldType)
    : "text";
  const storedRule = parseStoredRule(field.visibleRuleJson);
  return {
    categoryCode: field.categoryId ?? "COMMON",
    helpText: storedRule.helpText,
    key: field.fieldKey,
    label: field.label,
    maxSelections: storedRule.maxSelections,
    maxValue: storedRule.maxValue,
    minSelections: storedRule.minSelections,
    minValue: storedRule.minValue,
    module: storedRule.module,
    options: parseOptions(field.optionsJson),
    precision: field.precision ?? undefined,
    required: field.required,
    requiredRule: storedRule.requiredRule ?? (field.required ? "是" : "否"),
    type,
    unit: field.unit || undefined,
    validationText: storedRule.validationText,
    visibleRule: storedRule.rule,
  };
}

export function validatePeerSalesRows(rows: SurveyPeerSalesRow[], noLocalPeerStores: boolean): string | null {
  if (noLocalPeerStores) {
    return null;
  }
  if (rows.length === 0) {
    return "请至少填写一行同城同质门店销售情况，或勾选本地暂无其他同质门店。";
  }
  for (const row of rows) {
    if (!row.mallName.trim()) {
      return "同城同质门店的商场名称不能为空。";
    }
    if (!Number.isFinite(row.salesWan) || row.salesWan < 0) {
      return "同城同质门店销售额必须为0或正数。";
    }
  }
  return null;
}

export function sanitizeMerchantReasonText(text: string): string | null {
  const normalized = text.replace(/\s/g, "");
  if (broadExcusePatterns.some((pattern) => normalized.includes(pattern))) {
    const hasConcreteAction = ["员工", "陈列", "库存", "新品", "主推", "服务", "转化", "会员"].some((keyword) => normalized.includes(keyword));
    return hasConcreteAction ? null : "请进一步说明本店可以改善的具体问题或动作。";
  }
  return null;
}

function toStoredField(
  field: SurveyFieldDefinition,
  input: { categoryId: string | null; id: string; mallId: string; sortOrder: number; timestamp: string },
): SurveyStoredFormField {
  return {
    categoryId: input.categoryId,
    createdAt: input.timestamp,
    enabled: true,
    fieldKey: field.key,
    id: input.id,
    label: field.label,
    mallId: input.mallId,
    optionsJson: JSON.stringify(field.options ?? []),
    precision: field.precision ?? null,
    required: field.required,
    sortOrder: input.sortOrder,
    type: field.type,
    unit: field.unit ?? "",
    updatedAt: input.timestamp,
    visibleRuleJson: JSON.stringify({
      helpText: field.helpText,
      maxSelections: field.maxSelections,
      maxValue: field.maxValue,
      minSelections: field.minSelections,
      minValue: field.minValue,
      module: field.module,
      requiredRule: field.requiredRule,
      rule: field.visibleRule,
      validationText: field.validationText,
    }),
  };
}

export function categoryNameToCode(categoryName: string): string {
  const normalized = categoryName.trim();
  const directCodes = new Set(["COMMON", "DIGITAL_3C", "KIDS_FASHION", "KIDS_PRODUCTS", "HOME_APPLIANCE", "BEAUTY_HEALTH", "KIDS_ENTERTAINMENT", "EDUCATION"]);
  if (directCodes.has(normalized)) {
    return normalized;
  }
  if (normalized.includes("3C") || normalized.includes("数码")) return "DIGITAL_3C";
  if (normalized.includes("儿童鞋服") || normalized.includes("鞋服")) return "KIDS_FASHION";
  if (normalized.includes("儿童用品") || normalized.includes("母婴")) return "KIDS_PRODUCTS";
  if (normalized.includes("家电") || normalized.includes("家用") || normalized.includes("日用")) return "HOME_APPLIANCE";
  if (normalized.includes("美妆") || normalized.includes("个护") || normalized.includes("健康")) return "BEAUTY_HEALTH";
  if (normalized.includes("儿童游乐") || normalized.includes("游乐")) return "KIDS_ENTERTAINMENT";
  if (normalized.includes("教培") || normalized.includes("教育") || normalized.includes("培训")) return "EDUCATION";
  return normalized;
}

function dictionaryFieldToDefinition(field: (typeof surveyFieldDictionary)[number]): SurveyFieldDefinition {
  const options = field.optionsKey ? surveyOptionDictionary[field.optionsKey]?.map((option) => option.label) : undefined;
  const validation = parseJsonObject(field.validationJson);
  const visible = parseJsonObject(field.visibleRuleJson);
  return {
    categoryCode: field.categoryCode,
    helpText: stringOrUndefined(validation.help_text ?? validation.helpText ?? validation.description),
    key: field.fieldKey,
    label: field.label,
    maxSelections: numberOrUndefined(validation.max_selections ?? validation.maxSelections),
    maxValue: numberOrUndefined(validation.max ?? validation.max_value ?? validation.maxValue ?? field.maxValue),
    minSelections: numberOrUndefined(validation.min_selections ?? validation.minSelections),
    minValue: numberOrUndefined(validation.min ?? validation.min_value ?? validation.minValue ?? field.minValue),
    module: field.module,
    options,
    precision: field.precision ?? undefined,
    required: field.requiredRule === "是",
    requiredRule: field.requiredRule,
    type: mapDictionaryTypeToFieldType(field.type),
    unit: field.unit || undefined,
    validationText: stringOrUndefined(validation.message ?? validation.validation_text ?? validation.validationText),
    visibleRule: stringOrUndefined(visible.rule ?? field.visibleRuleJson),
  };
}

function parseOptions(value: string): string[] | undefined {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : undefined;
  } catch {
    return undefined;
  }
}

function parseStoredRule(value: string): Pick<
  SurveyFieldDefinition,
  "helpText" | "maxSelections" | "maxValue" | "minSelections" | "minValue" | "module" | "requiredRule" | "validationText" | "visibleRule"
> & { rule?: string } {
  try {
    const parsed = JSON.parse(value || "{}") as Record<string, unknown>;
    return {
      helpText: stringOrUndefined(parsed.helpText),
      maxSelections: numberOrUndefined(parsed.maxSelections),
      maxValue: numberOrUndefined(parsed.maxValue),
      minSelections: numberOrUndefined(parsed.minSelections),
      minValue: numberOrUndefined(parsed.minValue),
      module: stringOrUndefined(parsed.module),
      requiredRule: stringOrUndefined(parsed.requiredRule),
      rule: stringOrUndefined(parsed.rule),
      validationText: stringOrUndefined(parsed.validationText),
    };
  } catch {
    return {};
  }
}

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function numberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
