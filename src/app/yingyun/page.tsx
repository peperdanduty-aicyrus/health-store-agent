import Link from "next/link";
import { SurveyLoginForm } from "@/components/survey/SurveyLoginForm";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { buildOperatorDataset, formatRate, formatWan } from "@/lib/survey/operator-data";
import { getSurveyStore } from "@/lib/survey/repository";
import { getCurrentSurveyStaff } from "@/lib/survey/session";

export default async function SurveyOperatorPage() {
  const staff = await getCurrentSurveyStaff();
  if (!staff || staff.role !== "operator") {
    return (
      <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-md">
          <p className="mb-3 text-sm font-semibold text-coral">商场店铺调研系统营运后台</p>
          <SurveyLoginForm title="营运账号登录" />
        </div>
      </main>
    );
  }

  const store = await getSurveyStore();
  await store.ensureSurveyDemoStores();
  const stores = await store.listStores();
  const dataset = buildOperatorDataset(stores);
  const filledCount = dataset.rows.length;
  const lateCount = dataset.rows.filter((row) => row.metric.isLate).length;
  const totalSales = dataset.rows.reduce((sum, row) => sum + (row.metric.effectiveSalesWan ?? 0), 0);
  const totalTarget = dataset.rows.reduce((sum, row) => sum + (row.metric.salesTargetWan ?? 0), 0);

  return (
    <SurveyShell staff={staff} title="商场营运数据后台">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-5">
          <Card label="本月应填" value={`${dataset.activeStores.length}家`} />
          <Card label="已填" value={`${filledCount}家`} />
          <Card label="未填" value="0家" />
          <Card label="逾期提交" value={`${lateCount}家`} />
          <Card label="完成率" value={formatRate(filledCount / dataset.activeStores.length)} />
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <Card label="整体销售" value={formatWan(totalSales)} />
          <Card label="整体目标完成率" value={formatRate(totalTarget ? totalSales / totalTarget : null)} />
          <Card label="增长店铺" value={`${dataset.rows.filter((row) => (row.metric.momRate ?? 0) > 0).length}家`} />
          <Card label="下降店铺" value={`${dataset.rows.filter((row) => (row.metric.momRate ?? 0) < 0).length}家`} />
          <Card label="重点关注" value={`${dataset.warningRows.length}项`} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">9个子业态概览</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-paper text-ink/58">
                  <tr>{["子业态", "门店", "销售", "目标完成", "增长", "下降"].map((item) => <th className="px-3 py-2" key={item}>{item}</th>)}</tr>
                </thead>
                <tbody>
                  {dataset.categorySummaries.map((item) => (
                    <tr className="border-t border-ink/8" key={item.subcategoryName}>
                      <td className="px-3 py-2 font-medium text-ink">{item.subcategoryName}</td>
                      <td className="px-3 py-2">{item.storeCount}</td>
                      <td className="px-3 py-2">{formatWan(item.totalSalesWan)}</td>
                      <td className="px-3 py-2">{formatRate(item.targetCompletionRate)}</td>
                      <td className="px-3 py-2">{item.upCount}</td>
                      <td className="px-3 py-2">{item.downCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">今日跟进</h2>
            <div className="mt-4 grid gap-3">
              <Card label="今日待跟进" value={`${dataset.followUpBuckets.today}项`} />
              <Card label="逾期未跟进" value={`${dataset.followUpBuckets.overdue}项`} />
              <Card label="待复查" value={`${dataset.followUpBuckets.review}项`} />
            </div>
            <Link className="mt-4 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" href="/yingyun/follow-ups">
              查看跟进记录
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">重点预警</h2>
          <div className="mt-4 grid gap-2">
            {dataset.warningRows.slice(0, 10).map((item) => (
              <Link className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm" href={`/yingyun/stores/${item.store.id}`} key={`${item.store.id}-${item.code}`}>
                {item.code} · {item.store.brandName} · {item.message}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </SurveyShell>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-sm text-ink/58">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
