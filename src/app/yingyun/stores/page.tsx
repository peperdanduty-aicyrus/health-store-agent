import Link from "next/link";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { DataTable, getOperatorContext } from "../operator-context";

export default async function StoresPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const rows = context.stores.map((store) => [
    store.storeCode,
    store.brandName,
    store.displayLocation,
    store.subcategoryName || store.categoryName,
    store.areaSqm,
    store.staffCount,
    store.status,
  ]);
  return (
    <SurveyShell staff={context.staff} title="门店管理">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">45家真实门店基础资料</h2>
        <p className="mt-1 text-sm text-ink/62">营运维护字段仅保留店铺编号、品牌、铺位、子业态、面积、员工人数、别名、状态和备注。</p>
        <div className="mt-4">
          <DataTable headers={["店铺编号", "品牌", "铺位", "子业态", "面积", "员工", "状态"]} rows={rows} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {context.dataset.rows.slice(0, 8).map((row) => (
            <Link className="rounded-md border border-ink/15 bg-paper px-3 py-2 text-sm" href={`/yingyun/stores/${row.store.id}`} key={row.store.id}>
              {row.store.brandName}
            </Link>
          ))}
        </div>
      </section>
    </SurveyShell>
  );
}
