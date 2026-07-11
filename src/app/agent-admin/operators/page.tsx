import { createOperatorAccount, deleteOperatorAssignment, saveOperatorAssignment } from "../ops-actions";
import { Field, Panel, StatusBadge } from "@/components/ops/OpsUi";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";
import { getOpsStore } from "@/lib/ops/repository";

export default async function OperatorAssignmentsPage() {
  const admin = await requireAdmin();
  const [dataStore, opsStore] = await Promise.all([getDataStore(), getOpsStore()]);
  const [users, clients, organizations, assignments] = await Promise.all([
    dataStore.listUsers(), opsStore.listClients(), opsStore.listOrganizations(), opsStore.listAssignments(),
  ]);
  const operators = users.filter((user) => user.role === "user");
  const usersById = new Map(operators.map((user) => [user.id, user]));
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const orgsById = new Map(organizations.map((org) => [org.id, org]));
  return (
    <AdminShell profile={admin}>
      <section className="space-y-6">
        <div><h2 className="text-2xl font-semibold text-ink">运营账号与机构分配</h2><p className="mt-2 text-sm text-ink/60">创建运营人员账号、设置机构范围和机构生成额度。合同与营收不会出现在运营人员端。</p></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="创建运营账号"><form action={createOperatorAccount} className="ops-form-grid compact"><Field label="运营账号"><input name="loginName" required /></Field><Field label="姓名"><input name="displayName" required /></Field><Field label="初始密码"><input name="password" minLength={8} required type="password" /></Field><Field label="默认每日额度"><input name="dailyLimit" type="number" min="1" defaultValue="30" /></Field><div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">创建运营账号</button></div></form></Panel>
          <Panel title="分配机构"><form action={saveOperatorAssignment} className="ops-form-grid compact"><Field label="运营人员"><select name="assignedUserId" required><option value="">请选择人员</option>{operators.filter((user) => !user.disabled).map((user) => <option key={user.id} value={user.id}>{user.storeName || user.phone}</option>)}</select></Field><Field label="客户"><select name="clientId" required><option value="">请选择客户</option>{clients.filter((client) => client.active).map((client) => <option key={client.id} value={client.id}>{client.clientName}</option>)}</select></Field><Field wide label="机构"><select name="organizationId" required><option value="">请选择机构</option>{organizations.filter((org) => org.active).map((org) => <option key={org.id} value={org.id}>{org.organizationName}</option>)}</select></Field><Field wide label="机构生成额度"><input name="generationLimit" type="number" min="0" defaultValue="0" /><small>第一阶段仅保存额度，内容生成模块在下一阶段使用。</small></Field><div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存分配</button></div></form></Panel>
        </div>
        <Panel title="当前机构分配">
          {assignments.length ? <div className="ops-list">{assignments.map((assignment) => <div className="ops-list-row" key={assignment.id}><span><strong>{usersById.get(assignment.assignedUserId)?.storeName || "未知运营人员"}</strong><small>{clientsById.get(assignment.clientId)?.clientName || "未知客户"} · {orgsById.get(assignment.organizationId)?.organizationName || "未知机构"} · 额度 {assignment.generationLimit}</small></span><StatusBadge status={usersById.get(assignment.assignedUserId)?.disabled ? "已禁用" : "已启用"} /><form action={deleteOperatorAssignment}><input name="id" type="hidden" value={assignment.id} /><button className="ops-button ops-button-danger small" type="submit">移除</button></form></div>)}</div> : <p className="text-sm text-ink/60">暂无机构分配。</p>}
        </Panel>
      </section>
    </AdminShell>
  );
}
