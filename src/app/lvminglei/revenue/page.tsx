import { saveOpsPayment } from "@/app/lvminglei/actions";
import { EmptyState, Field, money, PageHeader, Panel, StatusBadge } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { currentChinaMonth } from "@/lib/ops/date";
import { getOpsStore } from "@/lib/ops/repository";

export default async function RevenuePage() {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const [clients, payments] = await Promise.all([store.listClients(), store.listPayments()]);
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const expected = payments.reduce((sum, item) => sum + item.expectedAmount, 0);
  const received = payments.reduce((sum, item) => sum + item.receivedAmount, 0);
  return (
    <>
      <PageHeader title="营收管理" description="合同、服务费用、收款与续费信息仅在超级管理员页面返回。" />
      <section className="ops-kpi-grid revenue"><article className="ops-kpi"><span>累计应收</span><strong>{money(expected)}</strong></article><article className="ops-kpi"><span>累计已收</span><strong>{money(received)}</strong></article><article className="ops-kpi"><span>未收金额</span><strong>{money(expected - received)}</strong></article></section>
      <div className="ops-two-column balanced">
        <Panel title="新增收款记录">
          <form action={saveOpsPayment} className="ops-form-grid compact">
            <Field wide label="客户"><select name="clientId" required><option value="">请选择客户</option>{clients.filter((client) => client.active).map((client) => <option key={client.id} value={client.id}>{client.clientName}</option>)}</select></Field>
            <Field label="账单月份"><input name="billingMonth" type="month" defaultValue={currentChinaMonth()} required /></Field>
            <Field label="到期日期"><input name="dueDate" type="date" /></Field>
            <Field label="应收金额"><input name="expectedAmount" type="number" min="0" step="0.01" /></Field>
            <Field label="已收金额"><input name="receivedAmount" type="number" min="0" step="0.01" /></Field>
            <Field label="收款日期"><input name="receivedDate" type="date" /></Field>
            <Field label="状态"><select name="status"><option>待收款</option><option>部分收款</option><option>已收款</option><option>逾期</option></select></Field>
            <Field wide label="备注"><textarea name="notes" rows={3} /></Field>
            <div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存收款记录</button></div>
          </form>
        </Panel>
        <Panel title="收款记录">
          {payments.length ? <div className="ops-list">{payments.map((payment) => <div className="ops-list-row" key={payment.id}><span><strong>{clientsById.get(payment.clientId)?.clientName || "未知客户"}</strong><small>{payment.billingMonth} · 应收 {money(payment.expectedAmount)} · 已收 {money(payment.receivedAmount)}</small></span><StatusBadge status={payment.status} /></div>)}</div> : <EmptyState compact title="暂无收款记录" description="保存真实账单后再显示营收数据" />}
        </Panel>
      </div>
    </>
  );
}
