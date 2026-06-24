import { NextRequest, NextResponse } from "next/server";
import { getMerchantEditCookieName } from "@/lib/survey/merchant-cookie";
import { createMerchantEditToken } from "@/lib/survey/merchant-token";
import { getCurrentSurveyPeriod, sanitizeMerchantReasonText, surveyStoredFormFieldToDefinition, type SurveyFieldDefinition } from "@/lib/survey/merchant-form";
import { checkSurveyRateLimit, getSurveyClientKey } from "@/lib/survey/rate-limit";
import { getSurveyStore } from "@/lib/survey/repository";
import type { SurveyPeerSalesRow } from "@/lib/survey/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const store = await getSurveyStore();
  await store.ensureSurveyDemoStores();
  const storeId = String(formData.get("storeId") || "");
  const selectedStore = await store.getStoreById(storeId);
  const fail = (message: string) => redirectToForm(request, storeId, message);
  if (!selectedStore || selectedStore.status !== "active") {
    return fail("门店不可填报，请联系营运人员核对门店状态。");
  }
  if (!checkSurveyRateLimit("merchant_submit", `${storeId}:${getSurveyClientKey(request.headers)}`, { limit: 20, windowMs: 60_000 })) {
    return fail("操作过于频繁，请稍后再试。");
  }

  const defaultPeriod = getCurrentSurveyPeriod();
  const openPeriods = await store.resolveMerchantFillPeriods(selectedStore.mallId, new Date());
  const requestedPeriodMonth = String(formData.get("periodMonth") || "");
  const selectedPeriod = openPeriods.find((item) => item.periodMonth === requestedPeriodMonth) ?? openPeriods[0];
  const period = selectedPeriod
    ? {
        isLate: selectedPeriod.status === "reopened" || new Date() > new Date(selectedPeriod.normalFillEndsAt || defaultPeriod.normalFillEndsAt),
        periodMonth: selectedPeriod.periodMonth,
      }
    : { isLate: defaultPeriod.isLate, periodMonth: defaultPeriod.periodMonth };
  const existing = await store.getMerchantSubmissionForStoreMonth(storeId, period.periodMonth);
  const noLocalPeerStores = String(formData.get("noLocalPeerStores") || "") === "true";
  const peerRows = noLocalPeerStores ? [] : parsePeerRows(formData);
  const fieldValues = parseFieldValues(formData);
  const fields = (await store.listEnabledFormFields(selectedStore.mallId, selectedStore.formCategoryCode || selectedStore.categoryId)).map(surveyStoredFormFieldToDefinition);
  const validation = validateFieldValues(fieldValues, fields);
  if (validation) {
    return fail(validation);
  }

  const editCookieName = getMerchantEditCookieName(storeId, period.periodMonth);
  const existingToken = request.cookies.get(editCookieName)?.value;
  try {
    if (existing) {
      if (!existingToken) {
        return fail("本店本月数据已提交。当前浏览器没有修改权限，请联系营运人员。");
      }
      await store.updateMerchantSubmissionWithToken({
        editToken: existingToken,
        fieldValues,
        id: existing.id,
        memberRechargeWan: readNumberFromValues(fieldValues, "member_recharge_wan", "memberRechargeWan"),
        now: new Date(),
        peerRows,
        salesTargetWan: readNumberFromValues(fieldValues, "sales_target_wan", "salesTargetWan"),
        selfReportedSalesWan: readNumberFromValues(fieldValues, "self_reported_sales_wan", "selfReportedSalesWan"),
      });
      return NextResponse.redirect(new URL(`/survey?storeId=${encodeURIComponent(storeId)}&submitted=${encodeURIComponent(existing.id)}`, request.url), 303);
    }

    const token = await createMerchantEditToken();
    const submission = await store.createMerchantSubmission({
      categoryName: selectedStore.categoryName,
      editToken: token.token,
      fieldValues,
      isLate: period.isLate,
      mallId: selectedStore.mallId,
      memberRechargeWan: readNumberFromValues(fieldValues, "member_recharge_wan", "memberRechargeWan"),
      noLocalPeerStores,
      peerRows,
      periodMonth: period.periodMonth,
      salesTargetWan: readNumberFromValues(fieldValues, "sales_target_wan", "salesTargetWan"),
      selfReportedSalesWan: readNumberFromValues(fieldValues, "self_reported_sales_wan", "selfReportedSalesWan"),
      storeId,
    });
    const response = NextResponse.redirect(new URL(`/survey?storeId=${encodeURIComponent(storeId)}&submitted=${encodeURIComponent(submission.id)}`, request.url), 303);
    response.cookies.set(editCookieName, token.token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "提交失败，请稍后重试。");
  }
}

function redirectToForm(request: NextRequest, storeId: string, message: string) {
  return NextResponse.redirect(new URL(`/survey?storeId=${encodeURIComponent(storeId)}&error=${encodeURIComponent(message)}`, request.url), 303);
}

function parseFieldValues(formData: FormData): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("field_")) continue;
    const fieldKey = key.replace(/^field_/, "");
    const existing = values[fieldKey];
    values[fieldKey] = existing ? (Array.isArray(existing) ? [...existing, String(value)] : [existing, String(value)]) : String(value);
  }
  return values;
}

function validateFieldValues(values: Record<string, unknown>, fields: SurveyFieldDefinition[]): string | null {
  for (const field of fields) {
    const value = values[field.key];
    const valuesCount = Array.isArray(value) ? value.length : value ? 1 : 0;
    if ((field.required || isConditionallyRequired(field, values)) && valuesCount === 0) return `请填写${field.label}。`;
    if (field.minSelections && valuesCount < field.minSelections) return `${field.label}至少选择${field.minSelections}项。`;
    if (field.maxSelections && valuesCount > field.maxSelections) return `${field.label}最多选择${field.maxSelections}项。`;
    if (field.type === "number" && value !== undefined && value !== "") {
      const numeric = Number(Array.isArray(value) ? value[0] : value);
      if (!Number.isFinite(numeric)) return `${field.label}必须为数字。`;
      if (field.minValue !== undefined && numeric < field.minValue) return `${field.label}不能小于${field.minValue}。`;
      if (field.maxValue !== undefined && numeric > field.maxValue) return `${field.label}不能大于${field.maxValue}。`;
      if (field.precision === 1 && Math.round(numeric * 10) !== numeric * 10) return `${field.label}最多保留1位小数。`;
      if (field.precision === 0 && !Number.isInteger(numeric)) return `${field.label}必须为整数。`;
    }
  }
  for (const value of Object.values(values)) {
    if (typeof value !== "string") continue;
    const message = sanitizeMerchantReasonText(value);
    if (message) return message;
  }
  return null;
}

function isConditionallyRequired(field: SurveyFieldDefinition, values: Record<string, unknown>): boolean {
  if (field.requiredRule !== "条件必填") return false;
  const rating = String(values.business_self_rating || "");
  if (field.key === "improvement_reason_codes") return ["明显提升", "小幅提升"].includes(rating);
  if (field.key === "decline_reason_codes") return ["小幅下降", "明显下降"].includes(rating);
  if (field.key === "stable_reason_text") return rating === "基本持平";
  if (field.key === "other_reason_text") {
    return [...toArray(values.improvement_reason_codes), ...toArray(values.decline_reason_codes)].some((value) => value.includes("其他"));
  }
  return false;
}

function parsePeerRows(formData: FormData): SurveyPeerSalesRow[] {
  const malls = formData.getAll("peerMallName").map(String);
  const sales = formData.getAll("peerSalesWan").map(String);
  return malls
    .map((mallName, index) => ({ mallName: mallName.trim(), salesWan: Number(sales[index] || "0") }))
    .filter((row) => row.mallName || Number.isFinite(row.salesWan));
}

function readNumberFromValues(values: Record<string, unknown>, key: string, fallbackKey: string): number {
  const raw = values[key] ?? values[fallbackKey] ?? "0";
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(value) ? value : 0;
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return value ? [String(value)] : [];
}
