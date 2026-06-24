import { NextResponse } from "next/server";
import { getSurveyStore } from "@/lib/survey/repository";
import { getCurrentSurveyStaff } from "@/lib/survey/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentSurveyStaff();
  if (!staff || staff.role !== "operator" || !staff.enabled || staff.expiresAt < new Date().toISOString()) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const store = await getSurveyStore();
  const report = await store.getSurveyReport(id);
  if (!report || report.mallId !== staff.mallId) return new NextResponse("Not Found", { status: 404 });
  const metrics = await store.listMonthlyMetrics(report.periodMonth, report.mallId);
  const csv = "\uFEFF" + [
    ["月份", "门店ID", "有效销售", "销售来源", "环比", "同比", "目标完成率", "坪效", "人效"].join(","),
    ...metrics.map((row) => [row.periodMonth, row.storeId, row.effectiveSalesWan, row.salesSource, row.momRate, row.yoyRate, row.targetCompletionRate, row.salesPerSqm, row.salesPerStaff].map(csvCell).join(",")),
  ].join("\n");
  await store.createAuditLog({ action: "report.export.data_csv", actorId: staff.id, actorType: "staff", detailJson: JSON.stringify({ reportId: id, rows: metrics.length }), mallId: staff.mallId, targetId: id, targetType: "report" });
  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${report.periodMonth}-${report.reportType}-data-${getShanghaiDate()}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function getShanghaiDate() {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "Asia/Shanghai", year: "numeric" }).formatToParts(new Date());
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
}
