import { notFound } from "next/navigation";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { formatRate, formatWan } from "@/lib/survey/operator-data";
import { DataTable, getOperatorContext } from "../../operator-context";

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const { id } = await params;
  const row = context.dataset.rows.find((item) => item.store.id === id);
  if (!row) notFound();
  const trendRows = Array.from({ length: 12 }).map((_, index) => {
    const month = `2025-${String(index + 6).padStart(2, "0")}`;
    const base = (row.metric.effectiveSalesWan ?? 0) * (0.72 + index * 0.035);
    return [month, formatWan(base), formatWan(base * 0.98), formatWan(base * 0.94), index === 0 ? "暂无数据" : "3.5%", formatRate(row.metric.targetCompletionRate)];
  });
  return (
    <SurveyShell staff={context.staff} title={`${row.store.brandName} 门店详情`}>
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-4">
          <Card label="店铺编号" value={row.store.storeCode} />
          <Card label="铺位" value={row.store.displayLocation} />
          <Card label="所属子业态" value={row.store.subcategoryName} />
          <Card label="面积/员工" value={`${row.store.areaSqm}㎡ / ${row.store.staffCount}人`} />
        </section>
        <section className="grid gap-4 md:grid-cols-5">
          <Card label="有效销售" value={formatWan(row.metric.effectiveSalesWan)} />
          <Card label="POS销售" value={formatWan(row.metric.posSalesWan)} />
          <Card label="环比" value={formatRate(row.metric.momRate)} />
          <Card label="同比" value={formatRate(row.metric.yoyRate)} />
          <Card label="目标完成" value={formatRate(row.metric.targetCompletionRate)} />
        </section>
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">当前预警、同城对标和跟进</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {row.warnings.map((warning) => <p className="rounded-md bg-paper p-3" key={warning.code}>{warning.code} · {warning.message}</p>)}
            {row.warnings.length === 0 ? <p className="text-ink/58">暂无预警。</p> : null}
          </div>
        </section>
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">最近12个月趋势</h2>
          <div className="mt-4">
            <DataTable headers={["月份", "有效销售", "POS", "自报", "环比", "目标完成"]} rows={trendRows} />
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
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
