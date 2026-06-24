import { SurveyShell } from "@/components/survey/SurveyShell";
import { saveSurveyPosSale } from "@/app/survey-actions";
import { formatRate, formatWan } from "@/lib/survey/operator-data";
import { DataTable, getOperatorContext } from "../operator-context";

export default async function PosPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const periodMonth = context.dataset.periodMonth;
  const posSales = await context.store.listPosSales(periodMonth, context.staff.mallId);
  const posByStore = new Map(posSales.map((item) => [item.storeId, item]));
  const rows = context.dataset.rows.map((row) => [
    row.store.storeCode,
    row.store.brandName,
    row.store.displayLocation,
    row.store.subcategoryName,
    formatWan(row.metric.merchantSalesWan),
    formatWan(row.metric.posSalesWan),
    formatWan(row.metric.salesTargetWan),
    formatWan(row.metric.selfPosDiffWan),
    formatRate(row.metric.selfPosDiffRate),
    posByStore.has(row.store.id) ? "已保存" : "待录入",
  ]);
  return (
    <SurveyShell staff={context.staff} title="POS正式销售额录入">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">类Excel录入表</h2>
            <p className="mt-1 text-sm text-ink/62">支持从Excel复制一列或多列后粘贴；异常单元格按“暂无数据”处理，保存失败不清空页面。</p>
          </div>
          <span className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">{periodMonth}</span>
        </div>
        <form action="/yingyun/pos/submit" className="mt-4 grid gap-3 rounded-md border border-ink/10 bg-paper p-4" method="post">
          <div className="grid gap-3 md:grid-cols-[160px_1fr_110px]">
            <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" defaultValue={periodMonth} name="periodMonth" type="month" />
            <textarea
              className="min-h-24 rounded-md border border-ink/12 bg-white p-3"
              name="posPasteText"
              placeholder={"店铺编号\\tPOS销售额\\t销售目标\\nB0177N001\\t18.8\\t17.5"}
            />
            <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white" type="submit">粘贴保存</button>
          </div>
          <p className="text-xs text-ink/55">支持从Excel复制多行三列：店铺编号、POS正式销售额、销售目标；同店同月自动更新。</p>
        </form>
        <div className="mt-4 grid gap-3">
          {context.stores.filter((store) => store.status === "active").slice(0, 45).map((store) => {
            const existing = posByStore.get(store.id);
            return (
              <form action={saveSurveyPosSale} className="grid gap-2 rounded-md border border-ink/10 bg-paper p-3 md:grid-cols-[1.2fr_110px_110px_1fr_80px]" key={store.id}>
                <input name="storeId" type="hidden" value={store.id} />
                <input name="periodMonth" type="hidden" value={periodMonth} />
                <div>
                  <p className="font-medium text-ink">{store.brandName || store.storeName}</p>
                  <p className="text-xs text-ink/55">{store.storeCode} · {store.displayLocation}</p>
                </div>
                <input className="min-h-10 rounded-md border border-ink/12 bg-white px-2" defaultValue={existing?.salesWan ?? ""} name="salesWan" placeholder="POS万元" step="0.1" type="number" />
                <input className="min-h-10 rounded-md border border-ink/12 bg-white px-2" defaultValue={existing?.targetSalesWan ?? ""} name="targetSalesWan" placeholder="目标万元" step="0.1" type="number" />
                <input className="min-h-10 rounded-md border border-ink/12 bg-white px-2" defaultValue={existing?.remark ?? ""} name="remark" placeholder="备注" />
                <button className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white" type="submit">保存</button>
              </form>
            );
          })}
        </div>
        <div className="mt-4">
          <DataTable headers={["店铺编号", "品牌", "铺位", "子业态", "商户自报", "POS正式销售", "销售目标", "差异金额", "差异比例", "保存状态"]} rows={rows} />
        </div>
      </section>
    </SurveyShell>
  );
}
