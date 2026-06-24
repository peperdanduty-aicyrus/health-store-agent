"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canOpenNewSurveyPeriod, type SurveyTermMonths } from "@/lib/survey/access";
import { getSurveyStore } from "@/lib/survey/repository";
import { surveySessionCookieName, requireSurveyStaff, requireSurveySuperAdmin } from "@/lib/survey/session";
import { buildCandidateSearchText, parseStoreImportText, validateStoreImportRows } from "@/lib/survey/store-import";
import type { SurveyStaffAccount, SurveyStoreStatus } from "@/lib/survey/types";

export type SurveyActionState = {
  message: string;
  resultCsv?: string;
  success: boolean;
};

export async function loginSurveyStaff(_previousState: SurveyActionState, formData: FormData): Promise<SurveyActionState> {
  const loginName = String(formData.get("loginName") || "").trim();
  const password = String(formData.get("password") || "");
  const store = await getSurveyStore();
  const account = await store.loginStaff(loginName, password);
  if (!account) {
    return { message: "账号或密码不正确，或账号已被禁用。", success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(surveySessionCookieName, account.id, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });
  await writeAudit(account, "login", "staff_account", account.id, { loginName });
  redirect(account.role === "super_admin" ? "/cyrus" : "/yingyun");
}

export async function logoutSurveyStaff() {
  const staff = await requireSurveyStaff();
  const cookieStore = await cookies();
  cookieStore.delete(surveySessionCookieName);
  await writeAudit(staff, "logout", "staff_account", staff.id, { loginName: staff.loginName });
  redirect(staff.role === "super_admin" ? "/cyrus" : "/yingyun");
}

export async function createSurveyOperator(formData: FormData): Promise<void> {
  const admin = await requireSurveySuperAdmin();
  const loginName = String(formData.get("loginName") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  if (!loginName || !password || !displayName) {
    return;
  }
  const termMonths = readTermMonths(formData);
  const store = await getSurveyStore();
  const account = await store.createStaffAccount({
    displayName,
    loginName,
    mallId: admin.mallId,
    password,
    phone: String(formData.get("phone") || ""),
    role: "operator",
    startsAt: String(formData.get("startsAt") || new Date().toISOString().slice(0, 10)),
    termMonths,
  });
  await writeAudit(admin, "create_operator", "staff_account", account.id, { loginName, termMonths });
  revalidatePath("/cyrus");
}

export async function toggleSurveyStaffEnabled(formData: FormData): Promise<void> {
  const admin = await requireSurveySuperAdmin();
  const accountId = String(formData.get("accountId") || "");
  const enabled = String(formData.get("enabled") || "") === "true";
  const updated = await (await getSurveyStore()).updateStaffAccountEnabled(accountId, enabled);
  if (updated) {
    await writeAudit(admin, enabled ? "enable_operator" : "disable_operator", "staff_account", updated.id, {
      loginName: updated.loginName,
    });
  }
  revalidatePath("/cyrus");
}

export async function updateSurveyStaffTerm(formData: FormData): Promise<void> {
  const admin = await requireSurveySuperAdmin();
  const accountId = String(formData.get("accountId") || "");
  const startsAt = String(formData.get("startsAt") || new Date().toISOString().slice(0, 10));
  const termMonths = readTermMonths(formData);
  const updated = await (await getSurveyStore()).updateStaffAccountTerm(accountId, startsAt, termMonths);
  if (updated) {
    await writeAudit(admin, "renew_operator", "staff_account", updated.id, {
      expiresAt: updated.expiresAt,
      startsAt,
      termMonths,
    });
  }
  revalidatePath("/cyrus");
}

export async function createSurveyCategory(formData: FormData): Promise<void> {
  const admin = await requireSurveySuperAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    return;
  }
  const category = await (await getSurveyStore()).createCategory({
    enabled: true,
    mallId: admin.mallId,
    name,
    sortOrder: Number(formData.get("sortOrder") || "99"),
  });
  await writeAudit(admin, "create_category", "business_category", category.id, { name });
  revalidatePath("/cyrus");
}

export async function createSurveySubcategory(formData: FormData): Promise<void> {
  const admin = await requireSurveySuperAdmin();
  const categoryId = String(formData.get("categoryId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!categoryId || !name) {
    return;
  }
  const subcategory = await (await getSurveyStore()).createSubcategory({
    categoryId,
    enabled: true,
    mallId: admin.mallId,
    name,
    sortOrder: Number(formData.get("sortOrder") || "99"),
  });
  await writeAudit(admin, "create_subcategory", "business_subcategory", subcategory.id, { categoryId, name });
  revalidatePath("/cyrus");
}

export async function saveSurveyStore(formData: FormData): Promise<void> {
  const admin = await requireSurveySuperAdmin();
  const store = await getSurveyStore();
  const brand = await store.upsertBrand({ mallId: admin.mallId, name: String(formData.get("brandName") || "").trim() });
  const storeId = String(formData.get("storeId") || "");
  const input = {
    areaSqm: Number(formData.get("areaSqm") || "0"),
    brandId: brand.id,
    categoryId: String(formData.get("categoryId") || ""),
    chainStore: String(formData.get("chainStore") || "") === "true",
    contactPhone: String(formData.get("contactPhone") || ""),
    contractEndDate: String(formData.get("contractEndDate") || ""),
    contractStartDate: String(formData.get("contractStartDate") || ""),
    displayLocation: `${String(formData.get("floor") || "")}-${String(formData.get("unitNo") || "")}`,
    floor: String(formData.get("floor") || ""),
    managerName: String(formData.get("managerName") || ""),
    mallId: admin.mallId,
    operationMode: String(formData.get("operationMode") || ""),
    operatorName: String(formData.get("operatorName") || ""),
    rentMode: String(formData.get("rentMode") || ""),
    staffCount: Number(formData.get("staffCount") || "0"),
    status: String(formData.get("status") || "active") as SurveyStoreStatus,
    storeCode: String(formData.get("storeCode") || ""),
    storeName: String(formData.get("storeName") || formData.get("brandName") || ""),
    subcategoryId: String(formData.get("subcategoryId") || ""),
    unitNo: String(formData.get("unitNo") || ""),
  };

  const record = storeId ? await store.updateStore({ ...input, id: storeId }) : await store.createStore(input);
  if (record) {
    await writeAudit(admin, storeId ? "update_store" : "create_store", "store", record.id, {
      brandName: record.brandName,
      displayLocation: record.displayLocation,
    });
  }
  revalidatePath("/cyrus");
}

export async function updateSurveyStoreStatus(formData: FormData): Promise<void> {
  const admin = await requireSurveySuperAdmin();
  const storeId = String(formData.get("storeId") || "");
  const status = String(formData.get("status") || "active") as SurveyStoreStatus;
  const updated = await (await getSurveyStore()).updateStoreStatus(storeId, status);
  if (updated) {
    await writeAudit(admin, `${status}_store`, "store", updated.id, { status });
  }
  revalidatePath("/cyrus");
}

export async function updateSurveyStoreAliases(formData: FormData): Promise<void> {
  const admin = await requireSurveySuperAdmin();
  const storeId = String(formData.get("storeId") || "");
  const aliases = String(formData.get("aliases") || "")
    .split(/[;；、,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  await (await getSurveyStore()).setStoreAliases(storeId, aliases);
  await writeAudit(admin, "update_store_aliases", "store", storeId, { aliases });
  revalidatePath("/cyrus");
}

export async function saveSurveyPosSale(formData: FormData): Promise<void> {
  const staff = await requireSurveyStaff();
  const salesWan = readOptionalOneDecimal(formData, "salesWan");
  const targetSalesWan = readOptionalOneDecimal(formData, "targetSalesWan");
  await (await getSurveyStore()).upsertPosSale({
    actorId: staff.id,
    mallId: staff.mallId,
    periodMonth: String(formData.get("periodMonth") || ""),
    remark: String(formData.get("remark") || ""),
    salesWan,
    source: "manual_entry",
    storeId: String(formData.get("storeId") || ""),
    targetSalesWan,
  });
  revalidatePath("/yingyun");
  revalidatePath("/yingyun/pos");
  revalidatePath("/yingyun/warnings");
  revalidatePath("/yingyun/trends");
}

export async function saveSurveyPosPaste(formData: FormData): Promise<void> {
  const staff = await requireSurveyStaff();
  const periodMonth = String(formData.get("periodMonth") || "");
  const pasteText = String(formData.get("posPasteText") || "");
  const stores = await (await getSurveyStore()).listStores();
  const storeByCode = new Map(stores.map((store) => [store.storeCode.trim().toLowerCase(), store]));
  const store = await getSurveyStore();
  for (const line of pasteText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    const [storeCode, salesRaw, targetRaw, ...remarkParts] = line.split(/\t|,/).map((item) => item.trim());
    const targetStore = storeByCode.get(storeCode.toLowerCase());
    if (!targetStore || targetStore.mallId !== staff.mallId) {
      continue;
    }
    await store.upsertPosSale({
      actorId: staff.id,
      mallId: staff.mallId,
      periodMonth,
      remark: remarkParts.join(" ") || "批量粘贴",
      salesWan: parseOptionalOneDecimal(salesRaw),
      source: "excel_paste",
      storeId: targetStore.id,
      targetSalesWan: parseOptionalOneDecimal(targetRaw),
    });
  }
  revalidatePath("/yingyun");
  revalidatePath("/yingyun/pos");
  revalidatePath("/yingyun/warnings");
  revalidatePath("/yingyun/trends");
}

export async function saveSurveyPeriod(formData: FormData): Promise<void> {
  const staff = await requireSurveyStaff();
  const action = String(formData.get("periodAction") || "open");
  const input = {
    actorId: staff.id,
    mallId: staff.mallId,
    normalFillEndsAt: String(formData.get("normalFillEndsAt") || "") || null,
    normalFillStartsAt: String(formData.get("normalFillStartsAt") || "") || null,
    periodMonth: String(formData.get("periodMonth") || ""),
    reopenedUntil: String(formData.get("reopenedUntil") || "") || null,
  };
  const store = await getSurveyStore();
  if (action === "close") {
    await store.closeSurveyPeriod(input);
  } else if (action === "reopen") {
    await store.reopenSurveyPeriod(input);
  } else {
    await store.openSurveyPeriod(input);
  }
  revalidatePath("/yingyun/periods");
  revalidatePath("/survey");
}

export async function saveSurveyFollowUp(formData: FormData): Promise<void> {
  const staff = await requireSurveyStaff();
  const input = {
    actorId: staff.id,
    followUpDate: String(formData.get("followUpDate") || new Date().toISOString().slice(0, 10)),
    followUpItem: String(formData.get("followUpItem") || ""),
    followUpMethod: String(formData.get("followUpMethod") || ""),
    id: String(formData.get("followUpId") || "") || undefined,
    mallId: staff.mallId,
    merchantFeedback: String(formData.get("merchantFeedback") || ""),
    nextAction: String(formData.get("nextAction") || ""),
    nextFollowUpDate: String(formData.get("nextFollowUpDate") || "") || null,
    ownerName: String(formData.get("ownerName") || staff.displayName),
    periodMonth: String(formData.get("periodMonth") || ""),
    status: readFollowUpStatus(formData),
    storeId: String(formData.get("storeId") || ""),
    warningId: String(formData.get("warningId") || ""),
  };
  const store = await getSurveyStore();
  if (input.id) {
    await store.updateFollowUp({ ...input, id: input.id });
  } else {
    await store.createFollowUp(input);
  }
  revalidatePath("/yingyun");
  revalidatePath("/yingyun/follow-ups");
}

export async function importSurveyStores(
  _previousState: SurveyActionState,
  formData: FormData,
): Promise<SurveyActionState> {
  const admin = await requireSurveySuperAdmin();
  const rawText = String(formData.get("storeImportText") || "");
  const store = await getSurveyStore();
  const rows = parseStoreImportText(rawText);
  const result = validateStoreImportRows(rows, {
    categories: await store.listCategories(),
    existingStores: await store.listStores(),
    mallId: admin.mallId,
  });

  for (const candidate of result.validRows) {
    const brand = await store.upsertBrand({ mallId: admin.mallId, name: candidate.brandName });
    const categories = await store.listCategories();
    const category = categories.find((item) => item.name === candidate.categoryName);
    const created = await store.createStore({
      areaSqm: candidate.areaSqm,
      brandId: brand.id,
      categoryId: category?.id ?? "",
      chainStore: candidate.chainStore,
      contactPhone: candidate.contactPhone,
      contractEndDate: candidate.contractEndDate,
      contractStartDate: candidate.contractStartDate,
      displayLocation: candidate.displayLocation,
      floor: candidate.floor,
      managerName: candidate.managerName,
      mallId: admin.mallId,
      operationMode: candidate.operationMode,
      operatorName: candidate.operatorName,
      rentMode: candidate.rentMode,
      staffCount: candidate.staffCount,
      status: "active",
      storeCode: candidate.storeCode,
      storeName: candidate.storeName,
      subcategoryId: "",
      unitNo: candidate.unitNo,
    });
    await store.setStoreAliases(created.id, candidate.aliases);
    created.searchText = buildCandidateSearchText(candidate);
  }

  await writeAudit(admin, "import_stores", "store", "batch", {
    errorRows: result.errorRows.length,
    validRows: result.validRows.length,
  });
  revalidatePath("/cyrus");

  return {
    message: `预检查完成：成功导入 ${result.validRows.length} 行，错误 ${result.errorRows.length} 行。`,
    resultCsv: [
      "行号,结果,原因",
      ...result.validRows.map((_row, index) => `${index + 2},成功,已导入`),
      ...result.errorRows.map((row) => `${row.rowNumber},失败,${row.reason}`),
    ].join("\n"),
    success: result.errorRows.length === 0,
  };
}

export async function assertOperatorCanOpenNewPeriod(): Promise<boolean> {
  const staff = await requireSurveyStaff();
  return canOpenNewSurveyPeriod(staff);
}

async function writeAudit(
  actor: SurveyStaffAccount,
  action: string,
  targetType: string,
  targetId: string,
  detail: Record<string, unknown>,
) {
  await (await getSurveyStore()).createAuditLog({
    action,
    actorId: actor.id,
    actorType: "staff",
    detailJson: JSON.stringify(detail),
    mallId: actor.mallId,
    targetId,
    targetType,
  });
}

function readTermMonths(formData: FormData): SurveyTermMonths {
  const months = Number(formData.get("termMonths") || "3");
  return months === 6 || months === 12 ? months : 3;
}

function readOptionalOneDecimal(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) || "").trim();
  return parseOptionalOneDecimal(raw);
}

function parseOptionalOneDecimal(raw: string): number | null {
  if (!raw) {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || Math.round(value * 10) !== value * 10) {
    throw new Error("请输入非负数字，最多保留1位小数。");
  }
  return value;
}

function readFollowUpStatus(formData: FormData) {
  const value = String(formData.get("status") || "待联系");
  return ["待联系", "已联系", "整改中", "待跟进", "跟进中", "待复查", "已完成", "暂不处理"].includes(value)
    ? value as "待联系" | "已联系" | "整改中" | "待跟进" | "跟进中" | "待复查" | "已完成" | "暂不处理"
    : "待联系";
}
