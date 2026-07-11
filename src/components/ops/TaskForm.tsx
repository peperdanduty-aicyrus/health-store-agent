import { saveOpsTask } from "@/app/lvminglei/actions";
import type { Profile } from "@/lib/data/types";
import { opsTaskStatuses, type OpsClient, type OpsOrganization, type OpsTask } from "@/lib/ops/types";
import { Field } from "./OpsUi";

export function TaskForm({ task, clients, organizations, operators, defaults }: {
  task?: OpsTask;
  clients: OpsClient[];
  organizations: OpsOrganization[];
  operators: Profile[];
  defaults?: { clientId?: string; organizationId?: string };
}) {
  return (
    <form action={saveOpsTask} className="ops-form-grid">
      {task ? <input name="id" type="hidden" value={task.id} /> : null}
      <Field label="客户"><select name="clientId" defaultValue={task?.clientId || defaults?.clientId || ""} required><option value="">请选择客户</option>{clients.filter((item) => item.active).map((client) => <option key={client.id} value={client.id}>{client.clientName}</option>)}</select></Field>
      <Field label="机构"><select name="organizationId" defaultValue={task?.organizationId || defaults?.organizationId || ""} required><option value="">请选择机构</option>{organizations.filter((item) => item.active).map((org) => <option key={org.id} value={org.id}>{org.organizationName}</option>)}</select></Field>
      <Field wide label="任务标题"><input name="title" defaultValue={task?.title} required /></Field>
      <Field label="任务类型"><select name="taskType" defaultValue={task?.taskType || "临时待办"}>{["文案生成", "文案处理", "客户交付", "计划发布时间", "复盘日期", "客户跟进", "临时待办"].map((value) => <option key={value}>{value}</option>)}</select></Field>
      <Field label="状态"><select name="status" defaultValue={task?.status || "待处理"}>{opsTaskStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
      <Field label="计划日期"><input name="scheduledDate" type="date" defaultValue={task?.scheduledDate} /></Field>
      <Field label="截止日期"><input name="dueDate" type="date" defaultValue={task?.dueDate} /></Field>
      <Field label="优先级"><select name="priority" defaultValue={task?.priority || "普通"}><option>普通</option><option>重要</option><option>紧急</option></select></Field>
      <Field label="运营人员"><select name="assignedUserId" defaultValue={task?.assignedUserId || ""}><option value="">暂不分配</option>{operators.map((operator) => <option key={operator.id} value={operator.id}>{operator.storeName || operator.phone}</option>)}</select></Field>
      <Field label="相关平台"><input name="relatedPlatform" defaultValue={task?.relatedPlatform} placeholder="公众号 / 小红书 / 抖音等" /></Field>
      <Field label="关键词"><input name="keyword" defaultValue={task?.keyword} /></Field>
      <Field wide label="任务说明"><textarea name="description" rows={5} defaultValue={task?.description} /></Field>
      <div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存任务</button></div>
    </form>
  );
}
