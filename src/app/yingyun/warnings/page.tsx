import { SurveyShell } from "@/components/survey/SurveyShell";
import { formatRate, formatWan } from "@/lib/survey/operator-data";
import { DataTable, getOperatorContext } from "../operator-context";

export default async function WarningsPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const warningRows = context.dataset.warningRows.map((item) => [
    item.code,
    item.message,
    item.severity,
    item.store.brandName,
    item.store.subcategoryName,
    formatWan(item.metric.effectiveSalesWan),
    formatRate(item.metric.momRate),
    formatRate(item.metric.targetCompletionRate),
  ]);
  const rankingRows = [...context.dataset.rows]
    .sort((left, right) => (right.metric.effectiveSalesWan ?? -1) - (left.metric.effectiveSalesWan ?? -1))
    .slice(0, 15)
    .map((row, index) => [index + 1, row.store.brandName, row.store.subcategoryName, formatWan(row.metric.effectiveSalesWan), formatWan(row.metric.salesPerSqm), formatWan(row.metric.salesPerStaff)]);
  return (
    <SurveyShell staff={context.staff} title="排名与预警">
      <div className="space-y-5">
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">11项启用预警</h2>
          <p className="mt-1 text-sm text-ink/62">W09 合同三个月内到期已禁用，不进入统计、列表和报告。</p>
          <div className="mt-4">
            <DataTable headers={["编号", "原因", "等级", "品牌", "子业态", "有效销售", "环比", "目标完成"]} rows={warningRows} />
          </div>
        </section>
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-ink">销售、坪效、人效排名</h2>
          <div className="mt-4">
            <DataTable headers={["排名", "品牌", "子业态", "销售", "坪效", "人效"]} rows={rankingRows} />
          </div>
        </section>
      </div>
    </SurveyShell>
  );
}
