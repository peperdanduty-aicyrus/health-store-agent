import { NextResponse } from "next/server";
import { renderPlainText } from "@/lib/ai/report-export";
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
  if (!report || report.mallId !== staff.mallId || !report.confirmedVersionId) return new NextResponse("Not Found", { status: 404 });
  const versions = await store.listSurveyReportVersions(id);
  const version = versions.find((item) => item.id === report.confirmedVersionId);
  if (!version) return new NextResponse("Not Found", { status: 404 });
  const text = "\uFEFF" + renderPlainText(safeJson(version.contentJson));
  await store.createAuditLog({ action: "report.export.txt", actorId: staff.id, actorType: "staff", detailJson: JSON.stringify({ reportId: id, versionId: version.id }), mallId: staff.mallId, targetId: id, targetType: "report" });
  return new NextResponse(text, {
    headers: {
      "Content-Disposition": `attachment; filename="${report.periodMonth}-${report.reportType}-${getShanghaiDate()}.txt"`,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}

function getShanghaiDate() {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "Asia/Shanghai", year: "numeric" }).formatToParts(new Date());
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
}
