import Link from "next/link";
import { notFound } from "next/navigation";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { renderPlainText } from "@/lib/ai/report-export";
import { getOperatorContext } from "../../operator-context";
import { confirmSurveyReportVersion, markSurveyReportCurrentVersion, saveSurveyReportManualVersion } from "../actions";

export default async function ReportDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ versionId?: string }> }) {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const { id } = await params;
  const { versionId } = await searchParams;
  const report = await context.store.getSurveyReport(id);
  if (!report || report.mallId !== context.staff.mallId) notFound();
  const versions = await context.store.listSurveyReportVersions(report.id);
  const current = versions.find((item) => item.id === versionId) ?? versions.find((item) => item.id === (report.confirmedVersionId ?? report.currentVersionId)) ?? versions[versions.length - 1];
  const content = safeJson(current?.contentJson);
  return (
    <SurveyShell staff={context.staff} title={report.title}>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink/60">{report.periodMonth} · {report.reportType} · {report.status}</p>
              <h2 className="text-xl font-semibold text-ink">{current?.title ?? report.title}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" href={`/yingyun/reports/${report.id}/docx`}>导出DOCX</Link>
              <Link className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" href={`/yingyun/reports/${report.id}/print`} target="_blank">打印HTML</Link>
              <Link className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" href={`/yingyun/reports/${report.id}/data.csv`}>数据CSV</Link>
              <Link className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" href={`/yingyun/reports/${report.id}/txt`}>导出TXT</Link>
            </div>
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded-md bg-paper p-4 text-sm leading-7 text-ink">{renderPlainText(content)}</pre>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-ink">人工编辑新版本</h3>
            <form action={saveSurveyReportManualVersion} className="mt-3 grid gap-3">
              <input name="reportId" type="hidden" value={report.id} />
              <input className="min-h-10 rounded-md border border-ink/12 px-3" defaultValue={`${report.title}-人工编辑`} name="title" />
              <textarea className="min-h-52 rounded-md border border-ink/12 p-3 text-sm" defaultValue={JSON.stringify(content, null, 2)} name="contentJson" />
              <input className="min-h-10 rounded-md border border-ink/12 px-3" name="versionNote" placeholder="版本说明" />
              <button className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" type="submit">保存新版本</button>
            </form>
          </section>

          <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-ink">版本历史</h3>
            <div className="mt-3 grid gap-2">
              {versions.map((version) => (
                <div className="rounded-md border border-ink/10 p-3 text-sm" key={version.id}>
                  <p className="font-medium">V{version.versionNo} · {version.versionKind} {report.currentVersionId === version.id ? "· 当前" : ""} {report.confirmedVersionId === version.id ? "· 已确认" : ""}</p>
                  <p className="mt-1 text-ink/60">{version.versionNote}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link className="rounded-md bg-paper px-3 py-2 text-xs font-medium text-ink" href={`/yingyun/reports/${report.id}?versionId=${version.id}`}>查看此版本</Link>
                    <form action={markSurveyReportCurrentVersion}>
                      <input name="reportId" type="hidden" value={report.id} />
                      <input name="versionId" type="hidden" value={version.id} />
                      <button className="rounded-md bg-paper px-3 py-2 text-xs font-medium text-ink" type="submit">标记为当前版本</button>
                    </form>
                    <form action={confirmSurveyReportVersion}>
                    <input name="reportId" type="hidden" value={report.id} />
                    <input name="versionId" type="hidden" value={version.id} />
                    <button className="rounded-md bg-paper px-3 py-2 text-xs font-medium text-ink" type="submit">标记为确认版本</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </SurveyShell>
  );
}

function safeJson(value: string | undefined) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return { raw: value ?? "" };
  }
}
