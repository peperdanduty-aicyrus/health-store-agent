import Link from "next/link";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { getOperatorContext } from "../operator-context";
import { generateSurveyAiReport, isSurveyReportMockProviderAllowed, retrySurveyAiReport } from "./actions";

const reportTypes = [
  ["leadership_brief", "领导简报"],
  ["full_analysis", "完整经营分析"],
  ["oral_briefing", "口头汇报稿"],
  ["store_analysis", "单店重点问题卡"],
] as const;

export default async function ReportsPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const reports = await context.store.listSurveyReports(context.staff.mallId);
  const jobs = await context.store.listSurveyAiReportJobs(context.staff.mallId);
  const mockAllowed = await isSurveyReportMockProviderAllowed();
  const visibleJobs = mockAllowed ? jobs : jobs.filter((job) => job.modelProvider !== "mock");
  return (
    <SurveyShell staff={context.staff} title="AI经营报告中心">
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">生成报告</h2>
          <p className="mt-1 text-sm text-ink/62">AI只负责解释和组织语言，销售、环比、同比、目标、坪效、人效和预警均来自第四阶段确定性结果。</p>
          <form action={generateSurveyAiReport} className="mt-4 grid gap-3">
            <label className="text-sm font-medium text-ink">月份</label>
            <input className="min-h-10 rounded-md border border-ink/12 px-3" defaultValue={context.dataset.periodMonth} name="periodMonth" type="month" />
            <label className="text-sm font-medium text-ink">报告类型</label>
            <select className="min-h-10 rounded-md border border-ink/12 px-3" name="reportType">
              {reportTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label className="text-sm font-medium text-ink">AI来源</label>
            <select className="min-h-10 rounded-md border border-ink/12 px-3" name="providerMode">
              <option value="auto">真实DeepSeek/兼容AI（按环境变量）</option>
              {mockAllowed ? <option value="mock">Mock演示生成</option> : null}
              {mockAllowed ? <option value="mock_fail">模拟AI失败</option> : null}
            </select>
            <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">生成AI初稿</button>
          </form>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">报告版本</h2>
          <div className="mt-4 grid gap-3">
            {reports.length ? reports.map((report) => (
              <Link className="rounded-md border border-ink/10 bg-paper p-4" href={`/yingyun/reports/${report.id}`} key={report.id}>
                <p className="font-medium text-ink">{report.title}</p>
                <p className="mt-1 text-sm text-ink/60">{report.periodMonth} · {report.reportType} · {report.status}</p>
              </Link>
            )) : <p className="text-sm text-ink/60">暂无报告。</p>}
          </div>
          <h3 className="mt-6 font-semibold text-ink">最近AI任务</h3>
          <div className="mt-3 grid gap-2 text-sm">
            {visibleJobs.slice(0, 8).map((job) => (
              <div className="rounded-md border border-ink/10 px-3 py-2" key={job.id}>
                <p>{job.periodMonth} · {job.reportType} · {job.status} · {job.modelProvider}:{job.modelName}</p>
                <p className="mt-1 text-xs text-ink/55">任务ID：{job.id} · 耗时：{job.elapsedMs ?? "暂无"}ms · Token：{summarizeUsage(job.tokenUsageJson)}</p>
                {job.errorMessage ? <p className="mt-1 text-coral">{job.errorMessage}</p> : null}
                {job.status === "failed" && mockAllowed ? (
                  <form action={retrySurveyAiReport} className="mt-2 flex flex-wrap gap-2">
                    <input name="periodMonth" type="hidden" value={job.periodMonth} />
                    <input name="reportType" type="hidden" value={job.reportType} />
                    <input name="providerMode" type="hidden" value="mock" />
                    <button className="rounded-md bg-paper px-3 py-2 text-xs font-medium text-ink" type="submit">用Mock重试</button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </SurveyShell>
  );
}

function summarizeUsage(value: string) {
  try {
    const parsed = JSON.parse(value || "{}") as Record<string, unknown>;
    return Object.keys(parsed).length ? JSON.stringify(parsed) : "接口未返回";
  } catch {
    return "接口未返回";
  }
}
