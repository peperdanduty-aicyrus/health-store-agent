import { SurveyShell } from "@/components/survey/SurveyShell";
import { DataTable, getOperatorContext } from "../operator-context";

export default async function FollowUpsPage() {
  const context = await getOperatorContext();
  if (!context.staff) return context.login;
  const followUps = await context.store.listFollowUps(context.dataset.periodMonth, context.staff.mallId);
  const storeNameById = new Map(context.stores.map((store) => [store.id, store.brandName || store.storeName]));
  const rows = followUps.map((item) => [
    storeNameById.get(item.storeId) ?? item.storeId,
    item.followUpItem,
    item.followUpMethod,
    item.status,
    item.ownerName,
    item.nextFollowUpDate || "",
    item.periodMonth,
  ]);
  return (
    <SurveyShell staff={context.staff} title="营运跟进记录">
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">今日、逾期和待复查</h2>
        <p className="mt-1 text-sm text-ink/62">字段覆盖跟进日期、方式、事项、反馈、下一步动作、下次跟进日期、状态、负责人、关联月份和预警。</p>
        <form action="/yingyun/follow-ups/submit" className="mt-4 grid gap-3 rounded-md border border-ink/10 bg-paper p-4 md:grid-cols-4" method="post">
          <select className="min-h-10 rounded-md border border-ink/12 bg-white px-3" name="storeId" required>
            {context.stores.filter((store) => store.status === "active").map((store) => (
              <option key={store.id} value={store.id}>{store.brandName || store.storeName} · {store.displayLocation}</option>
            ))}
          </select>
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" defaultValue={context.dataset.periodMonth} name="periodMonth" type="month" />
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" defaultValue={new Date().toISOString().slice(0, 10)} name="followUpDate" type="date" />
          <select className="min-h-10 rounded-md border border-ink/12 bg-white px-3" name="followUpMethod">
            <option>微信</option>
            <option>电话</option>
            <option>到店</option>
            <option>会议</option>
          </select>
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3 md:col-span-2" name="followUpItem" placeholder="跟进事项" required />
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" name="warningId" placeholder="关联预警编号" />
          <select className="min-h-10 rounded-md border border-ink/12 bg-white px-3" name="status">
            <option>待联系</option>
            <option>已联系</option>
            <option>整改中</option>
            <option>待跟进</option>
            <option>跟进中</option>
            <option>待复查</option>
            <option>已完成</option>
            <option>暂不处理</option>
          </select>
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3 md:col-span-2" name="merchantFeedback" placeholder="商户反馈" />
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" name="nextAction" placeholder="下一步动作" />
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" name="nextFollowUpDate" type="date" />
          <input className="min-h-10 rounded-md border border-ink/12 bg-white px-3" defaultValue={context.staff.displayName} name="ownerName" placeholder="负责人" />
          <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white md:col-span-3" type="submit">新增跟进</button>
        </form>
        <div className="mt-4">
          <DataTable headers={["品牌", "跟进事项", "方式", "状态", "负责人", "下次跟进", "关联月份"]} rows={rows} />
        </div>
      </section>
    </SurveyShell>
  );
}
