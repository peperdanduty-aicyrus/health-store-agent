import { createMockReportProvider } from "../src/lib/ai/deepseek";
import { exportReportDocx, createPrintableReportHtml } from "../src/lib/ai/report-export";
import { generateSurveyReport } from "../src/lib/ai/report-service";
import { getSurveyStore } from "../src/lib/survey/repository";
import type { SurveyReportType } from "../src/lib/survey/types";

const periodMonth = "2026-05";
const actorId = "stage5_smoke";
const reportTypes: SurveyReportType[] = ["leadership_brief", "full_analysis", "oral_briefing", "store_analysis"];

const store = await getSurveyStore();
await store.ensureSurveyDemoStores();
const stores = await store.listStores();
const mallId = Array.from(stores.filter((item) => item.status === "active").reduce((map, item) => map.set(item.mallId, (map.get(item.mallId) ?? 0) + 1), new Map<string, number>()))
  .sort((left, right) => right[1] - left[1])[0]?.[0] ?? "survey_mall_001";

const generated: Array<{ reportId: string; reportType: SurveyReportType }> = [];
for (const reportType of reportTypes) {
  const result = await generateSurveyReport({
    actorId,
    mallId,
    periodMonth,
    provider: createMockReportProvider("success"),
    reportType,
    store,
  });
  if (result.reportId) {
    generated.push({ reportId: result.reportId, reportType });
  }
}

for (const item of generated) {
  const versions = await store.listSurveyReportVersions(item.reportId);
  const source = versions[versions.length - 1];
  const edited = await store.createSurveyReportVersion({
    actorId,
    contentJson: source.contentJson,
    reportId: item.reportId,
    title: `${source.title}-人工确认版`,
    versionKind: "manual_edit",
    versionNote: "第五阶段本地验收人工编辑版",
  });
  await store.confirmSurveyReportVersion({ actorId, reportId: item.reportId, versionId: edited.id });
}

const failure = await generateSurveyReport({
  actorId,
  mallId,
  periodMonth,
  provider: createMockReportProvider("fail"),
  reportType: "leadership_brief",
  store,
});

const reports = await store.listSurveyReports(mallId);
const latest = reports.find((item) => item.periodMonth === periodMonth);
let docxBytes = 0;
let htmlBytes = 0;
if (latest?.confirmedVersionId) {
  const versions = await store.listSurveyReportVersions(latest.id);
  const version = versions.find((item) => item.id === latest.confirmedVersionId);
  if (version) {
    const content = JSON.parse(version.contentJson);
    docxBytes = exportReportDocx({ content, periodMonth: latest.periodMonth, reportType: latest.reportType, title: version.title }).body.length;
    htmlBytes = createPrintableReportHtml({ content, periodMonth: latest.periodMonth, reportType: latest.reportType, title: version.title }).length;
  }
}

const jobs = await store.listSurveyAiReportJobs(mallId);
const auditLogs = await store.listAuditLogs();
console.log(JSON.stringify({
  confirmedReports: reports.filter((item) => item.status === "confirmed").length,
  docxBytes,
  failedJobs: jobs.filter((item) => item.status === "failed").length,
  failureStatus: failure.status,
  generatedReports: generated.length,
  htmlBytes,
  jobCount: jobs.length,
  reportExportAuditLogs: auditLogs.filter((item) => item.action.startsWith("report.") || item.action.startsWith("ai_report.")).length,
}, null, 2));
