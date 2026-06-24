import { NextResponse } from "next/server";
import { getSurveyStore } from "@/lib/survey/repository";
import { getCurrentSurveyStaff } from "@/lib/survey/session";

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const staff = await getCurrentSurveyStaff();
  if (!staff || staff.role !== "operator") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { kind } = await params;
  const url = new URL(_request.url);
  const periodMonth = url.searchParams.get("periodMonth") || "2026-05";
  const store = await getSurveyStore();
  await store.ensureSurveyDemoStores();
  const rows = await buildRows(store, staff.mallId, kind, periodMonth);
  await store.createAuditLog({
    action: "export.csv",
    actorId: staff.id,
    actorType: "staff",
    detailJson: JSON.stringify({ kind, periodMonth, rows: rows.length }),
    mallId: staff.mallId,
    targetId: kind,
    targetType: "export",
  });
  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const exportDate = getShanghaiDate();
  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="survey-${kind}-${periodMonth}-${exportDate}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

function getShanghaiDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).formatToParts(new Date());
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
}

async function buildRows(store: Awaited<ReturnType<typeof getSurveyStore>>, mallId: string, kind: string, periodMonth: string): Promise<Array<Array<string | number | null>>> {
  const stores = await store.listStores();
  const activeStores = stores.filter((item) => item.mallId === mallId && item.status === "active");
  const storeNameById = new Map(activeStores.map((item) => [item.id, item.brandName || item.storeName]));
  if (kind === "pos") {
    const rows = await store.listPosSales(periodMonth, mallId);
    return [["月份", "门店", "POS销售额", "销售目标", "备注", "更新时间"], ...rows.map((row) => [row.periodMonth, storeNameById.get(row.storeId) ?? row.storeId, row.salesWan, row.targetSalesWan, row.remark, row.updatedAt])];
  }
  if (kind === "metrics") {
    const rows = await store.listMonthlyMetrics(periodMonth, mallId);
    return [["月份", "门店", "有效销售", "销售来源", "环比", "同比", "坪效", "人效", "目标完成率"], ...rows.map((row) => [row.periodMonth, storeNameById.get(row.storeId) ?? row.storeId, row.effectiveSalesWan, row.salesSource, row.momRate, row.yoyRate, row.salesPerSqm, row.salesPerStaff, row.targetCompletionRate])];
  }
  if (kind === "warnings") {
    const rows = await store.listWarningRecords(periodMonth, mallId);
    return [["月份", "门店", "编号", "预警", "等级"], ...rows.map((row) => [row.periodMonth, storeNameById.get(row.storeId) ?? row.storeId, row.code, row.message, row.severity])];
  }
  if (kind === "followups") {
    const rows = await store.listFollowUps(periodMonth, mallId);
    return [["月份", "门店", "跟进日期", "方式", "事项", "反馈", "下一步", "下次跟进", "状态", "负责人", "预警"], ...rows.map((row) => [row.periodMonth, storeNameById.get(row.storeId) ?? row.storeId, row.followUpDate, row.followUpMethod, row.followUpItem, row.merchantFeedback, row.nextAction, row.nextFollowUpDate, row.status, row.ownerName, row.warningId])];
  }
  if (kind === "stores") {
    return [["门店编号", "品牌", "铺位", "子业态", "表单业态", "面积", "员工数", "状态"], ...activeStores.map((row) => [row.storeCode, row.brandName || row.storeName, row.displayLocation, row.subcategoryName, row.formCategoryCode ?? "", row.areaSqm, row.staffCount, row.status])];
  }
  const submissions = await Promise.all(activeStores.map((item) => store.getMerchantSubmissionForStoreMonth(item.id, periodMonth)));
  return [
    ["月份", "门店", "自报销售", "目标", "充值", "逾期", "字段JSON", "提交时间"],
    ...submissions.filter(Boolean).map((row) => [row!.periodMonth, storeNameById.get(row!.storeId) ?? row!.storeId, row!.selfReportedSalesWan, row!.salesTargetWan, row!.memberRechargeWan, row!.isLate ? "是" : "否", row!.fieldValuesJson, row!.firstSubmittedAt]),
  ];
}

function csvCell(value: string | number | null) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
