import { notFound } from "next/navigation";
import {
  generateOpsReport,
  saveOpsAgreement,
  saveOpsOrganization,
  saveOpsTaskLog,
  setOpsClientActive,
} from "@/app/lvminglei/actions";
import { ClientForm } from "@/components/ops/ClientForm";
import { EmptyState, Field, PageHeader, Panel, StatusBadge } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getOpsStore } from "@/lib/ops/repository";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireWorkbenchOwner();
  const { id } = await params;
  const store = await getOpsStore();
  const client = await store.getClient(id);
  if (!client) notFound();
  const [organizations, tasks, logs, agreements, reports] = await Promise.all([
    store.listOrganizations(id), store.listTasks({ clientId: id }), store.listTaskLogs(id),
    store.listAgreements(id), store.listReports(id),
  ]);
  const agreement = agreements[0];
  return (
    <>
      <PageHeader title={client.clientName} description={`${client.brandName || "未填写品牌"} · ${client.city || "城市未填写"}`} />
      <div className="ops-detail-toolbar">
        <StatusBadge status={client.active ? client.cooperationStatus : "已停用"} />
        <form action={setOpsClientActive}><input name="id" type="hidden" value={client.id} /><input name="active" type="hidden" value={client.active ? "false" : "true"} /><button className="ops-button ops-button-secondary" type="submit">{client.active ? "停用客户" : "恢复客户"}</button></form>
        <a className="ops-button ops-button-secondary" href={`/lvminglei/tasks/new?clientId=${client.id}`}>添加任务</a>
      </div>
      <div className="ops-two-column">
        <Panel title="客户资料"><ClientForm client={client as unknown as Record<string, string | boolean>} /></Panel>
        <div className="ops-stack">
          <Panel title="机构管理">
            {organizations.length ? <div className="ops-list">{organizations.map((org) => <a className="ops-list-row" href={`/lvminglei/organizations/${org.id}`} key={org.id}><span><strong>{org.organizationName}</strong><small>{org.organizationType || "未填写类型"}</small></span><StatusBadge status={org.active ? "启用" : "停用"} /></a>)}</div> : <EmptyState compact title="暂无机构" description="一个客户可以添加多个门店或机构" />}
            <form action={saveOpsOrganization} className="ops-inline-form"><input name="clientId" type="hidden" value={client.id} /><input name="organizationName" placeholder="机构名称" required /><input name="organizationType" placeholder="机构类型" /><button className="ops-button ops-button-primary" type="submit">添加机构</button></form>
          </Panel>
          <Panel title="最近任务">
            {tasks.length ? <div className="ops-list">{tasks.slice(0, 5).map((task) => <a className="ops-list-row" href={`/lvminglei/tasks/${task.id}`} key={task.id}><span><strong>{task.title}</strong><small>{task.scheduledDate || task.dueDate || "未安排日期"}</small></span><StatusBadge status={task.status} /></a>)}</div> : <EmptyState compact title="暂无任务" description="从任务管理添加客户任务" />}
          </Panel>
        </div>
      </div>
      <div className="ops-two-column balanced">
        <Panel title="服务合同与费用">
          <form action={saveOpsAgreement} className="ops-form-grid compact">
            <input name="clientId" type="hidden" value={client.id} />
            <Field label="服务开始"><input name="serviceStartDate" type="date" defaultValue={agreement?.serviceStartDate} /></Field>
            <Field label="服务结束"><input name="serviceEndDate" type="date" defaultValue={agreement?.serviceEndDate} /></Field>
            <Field label="每月服务费"><input name="monthlyFee" type="number" min="0" step="0.01" defaultValue={agreement?.monthlyFee} /></Field>
            <Field label="结算日"><input name="settlementDay" type="number" min="1" max="31" defaultValue={agreement?.settlementDay || 1} /></Field>
            <Field label="应收金额"><input name="expectedAmount" type="number" min="0" step="0.01" defaultValue={agreement?.expectedAmount} /></Field>
            <Field label="已收金额"><input name="paidAmount" type="number" min="0" step="0.01" defaultValue={agreement?.paidAmount} /></Field>
            <Field label="收款状态"><select name="paymentStatus" defaultValue={agreement?.paymentStatus || "待收款"}><option>待收款</option><option>部分收款</option><option>已收款</option><option>逾期</option></select></Field>
            <Field label="续费可能"><input name="renewalProbability" defaultValue={agreement?.renewalProbability} /></Field>
            <Field wide label="服务范围"><textarea name="serviceScope" rows={3} defaultValue={agreement?.serviceScope} /></Field>
            <Field wide label="月度约定任务"><textarea name="monthlyTasks" rows={3} defaultValue={agreement?.monthlyTasks} /></Field>
            <Field wide label="每周约定任务"><textarea name="weeklyTasks" rows={3} defaultValue={agreement?.weeklyTasks} /></Field>
            <div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存合同资料</button></div>
          </form>
        </Panel>
        <Panel title="沟通与工作记录">
          {logs.length ? <div className="ops-list">{logs.slice(0, 8).map((log) => <div className="ops-list-row" key={log.id}><span><strong>{log.logType}</strong><small>{log.content}</small>{log.nextAction ? <small>下一步：{log.nextAction}</small> : null}</span></div>)}</div> : <EmptyState compact title="暂无工作记录" description="记录沟通、反馈、临时任务和下一步" />}
          <form action={saveOpsTaskLog} className="ops-form-grid compact">
            <input name="clientId" type="hidden" value={client.id} />
            <Field label="记录类型"><select name="logType"><option>工作记录</option><option>客户反馈</option><option>临时任务</option><option>沟通记录</option></select></Field>
            <Field label="关联机构"><select name="organizationId"><option value="">客户级记录</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.organizationName}</option>)}</select></Field>
            <Field wide label="记录内容"><textarea name="content" rows={3} required /></Field>
            <Field wide label="下一步要做什么"><textarea name="nextAction" rows={2} /></Field>
            <div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">添加记录</button></div>
          </form>
        </Panel>
      </div>
      <Panel title="每周与每月汇报">
        <div className="ops-report-actions">
          <form action={generateOpsReport}><input name="clientId" type="hidden" value={client.id} /><input name="reportType" type="hidden" value="weekly" /><button className="ops-button ops-button-primary" type="submit">生成每周汇报</button></form>
          <form action={generateOpsReport}><input name="clientId" type="hidden" value={client.id} /><input name="reportType" type="hidden" value="monthly" /><button className="ops-button ops-button-secondary" type="submit">生成每月汇报</button></form>
        </div>
        {reports.length ? <div className="ops-list">{reports.map((report) => <a className="ops-list-row" href={`/lvminglei/reports/${report.id}`} key={report.id}><span><strong>{report.reportType === "weekly" ? "每周汇报" : "每月汇报"}</strong><small>{report.periodStart} 至 {report.periodEnd}</small></span><StatusBadge status={report.status} /></a>)}</div> : <EmptyState compact title="暂无汇报草稿" description="汇报只会汇总真实任务与工作记录" />}
      </Panel>
    </>
  );
}
