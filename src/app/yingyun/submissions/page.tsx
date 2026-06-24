import { SurveyShell } from "@/components/survey/SurveyShell";
import { formatRate } from "@/lib/survey/operator-data";
import { DataTable, getOperatorContext } from "../operator-context";

export default async function SubmissionsPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const rows = context.dataset.rows.map((row) => [
    row.store.storeCode,
    row.store.brandName,
    row.store.displayLocation,
    row.store.subcategoryName,
    "已填",
    row.metric.isLate ? "逾期" : "正常",
    row.metric.posSalesWan === null ? "POS未录入" : "POS已录入",
    formatRate(row.metric.targetCompletionRate),
  ]);
  return (
    <SurveyShell staff={context.staff} title="填报管理">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">月度填报状态</h2>
        <p className="mt-1 text-sm text-ink/62">支持按月份、子业态、品牌、POS状态筛选；当前展示 {context.dataset.periodMonth}。</p>
        <div className="mt-4">
          <DataTable headers={["店铺编号", "品牌", "铺位", "子业态", "填报", "是否逾期", "POS状态", "目标完成"]} rows={rows} />
        </div>
      </section>
    </SurveyShell>
  );
}
