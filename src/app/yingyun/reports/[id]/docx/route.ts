import { NextResponse } from "next/server";
import { exportReportDocx } from "@/lib/ai/report-export";
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
  const output = exportReportDocx({ content: safeJson(version.contentJson), periodMonth: report.periodMonth, reportType: report.reportType, title: version.title });
  await store.createAuditLog({ action: "report.export.docx", actorId: staff.id, actorType: "staff", detailJson: JSON.stringify({ reportId: id, versionId: version.id }), mallId: staff.mallId, targetId: id, targetType: "report" });
  return new NextResponse(new Uint8Array(output.body), {
    headers: {
      "Content-Disposition": `attachment; filename="survey-report.docx"; filename*=UTF-8''${encodeURIComponent(output.fileName)}`,
      "Content-Type": output.headers.contentType,
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
