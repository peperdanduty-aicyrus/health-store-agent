import { SurveyShell } from "@/components/survey/SurveyShell";
import { getOperatorContext } from "../operator-context";

const exportItems = [
  ["submissions", "月度商户填报明细"],
  ["pos", "POS正式销售数据"],
  ["metrics", "环比同比、坪效人效与排名"],
  ["warnings", "预警名单"],
  ["followups", "营运跟进记录"],
  ["stores", "门店基础资料"],
] as const;

export default async function ExportsPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  return (
    <SurveyShell staff={context.staff} title="内部导出中心">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">内部数据导出</h2>
        <p className="mt-1 text-sm text-ink/62">本阶段不生成AI报告，只导出内部明细。Cloudflare运行环境受限时可降级为CSV。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {exportItems.map(([kind, item]) => (
            <div className="rounded-md border border-ink/10 bg-paper p-4" key={kind}>
              <p className="font-medium text-ink">{item}</p>
              <a className="mt-3 inline-flex rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" href={`/yingyun/exports/${kind}?periodMonth=${context.dataset.periodMonth}`}>导出CSV</a>
            </div>
          ))}
        </div>
      </section>
    </SurveyShell>
  );
}
