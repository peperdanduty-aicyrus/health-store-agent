import { SurveyShell } from "@/components/survey/SurveyShell";
import { formatRate, formatWan } from "@/lib/survey/operator-data";
import { DataTable, getOperatorContext } from "../operator-context";

export default async function TrendsPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const rows = context.dataset.categorySummaries.map((item) => [
    item.subcategoryName,
    item.storeCount,
    formatWan(item.totalSalesWan),
    formatRate(item.targetCompletionRate),
    item.upCount,
    item.downCount,
    "最近12个月",
  ]);
  const storeRows = context.dataset.rows.slice(0, 12).map((row) => [
    row.store.brandName,
    formatWan(row.metric.effectiveSalesWan),
    formatWan(row.metric.posSalesWan),
    formatWan(row.metric.merchantSalesWan),
    formatRate(row.metric.momRate),
    formatRate(row.metric.yoyRate),
    formatRate(row.metric.targetCompletionRate),
    formatWan(row.metric.salesPerSqm),
    formatWan(row.metric.salesPerStaff),
  ]);
  return (
    <SurveyShell staff={context.staff} title="趋势分析">
      <div className="space-y-5">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">9个子业态趋势摘要</h2>
          <div className="mt-4">
            <DataTable headers={["子业态", "门店", "销售总额", "目标完成", "增长店铺", "下降店铺", "趋势范围"]} rows={rows} />
          </div>
        </section>
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">单店最近12个月指标口径</h2>
          <div className="mt-4">
            <DataTable headers={["品牌", "有效销售", "POS", "自报", "环比", "同比", "目标完成", "坪效", "人效"]} rows={storeRows} />
          </div>
        </section>
      </div>
    </SurveyShell>
  );
}
