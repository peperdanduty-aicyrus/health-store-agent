import { renewOpsSubscription, saveOpsSubscription } from "@/app/lvminglei/actions";
import { EmptyState, Field, money, PageHeader, Panel, StatusBadge } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getOpsStore } from "@/lib/ops/repository";

export default async function SubscriptionsPage() {
  await requireWorkbenchOwner();
  const subscriptions = await (await getOpsStore()).listSubscriptions();
  return (
    <>
      <PageHeader title="会员到期管理" description="管理腾讯视频、ChatGPT、Canva、域名、服务器等会员和软件到期。" />
      <div className="ops-two-column balanced">
        <Panel title="新增会员或软件">
          <form action={saveOpsSubscription} className="ops-form-grid compact">
            <Field label="服务名称"><input name="serviceName" required /></Field><Field label="账号备注"><input name="accountNote" /></Field>
            <Field label="购买日期"><input name="purchaseDate" type="date" /></Field><Field label="到期日期"><input name="expiryDate" type="date" required /></Field>
            <Field label="价格"><input name="price" type="number" min="0" step="0.01" /></Field><Field label="计费周期"><input name="billingCycle" placeholder="月 / 年" /></Field>
            <Field label="状态"><select name="status"><option>使用中</option><option>即将到期</option><option>已到期</option><option>已停用</option></select></Field><Field label="自动续费"><span className="ops-checkbox"><input name="autoRenew" type="checkbox" /> 已开启自动续费</span></Field>
            <Field wide label="用途说明"><textarea name="usageNote" rows={3} /></Field><Field wide label="备注"><textarea name="notes" rows={3} /></Field>
            <div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存记录</button></div>
          </form>
        </Panel>
        <Panel title="会员与软件列表">
          {subscriptions.length ? <div className="ops-list">{subscriptions.map((item) => <div className="ops-subscription-row" key={item.id}><div><strong>{item.serviceName}</strong><small>{item.accountNote || "无账号备注"} · {money(item.price)}</small><small>到期：{item.expiryDate || "未填写"}</small></div><StatusBadge status={item.status} /><form action={renewOpsSubscription} className="ops-renew-form"><input name="id" type="hidden" value={item.id} /><input name="expiryDate" type="date" required /><button className="ops-button ops-button-secondary small" type="submit">已续费</button></form></div>)}</div> : <EmptyState compact title="暂无会员到期记录" description="添加真实服务后会按到期日排序" />}
        </Panel>
      </div>
    </>
  );
}
