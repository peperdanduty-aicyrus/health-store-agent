import { logout } from "@/app/actions";
import { addAssignedTaskLog, saveAssignedContentProfile, updateAssignedTask } from "./ops-actions";
import { EmptyState, Field, Panel, StatusBadge } from "@/components/ops/OpsUi";
import { requireUser } from "@/lib/auth/session";
import { chinaDate } from "@/lib/ops/date";
import { getOpsStore } from "@/lib/ops/repository";
import { opsTaskStatuses } from "@/lib/ops/types";

export default async function OperatorAppPage() {
  const profile = await requireUser();
  const store = await getOpsStore();
  const [assignments, allOrganizations, allClients, allTasks] = await Promise.all([
    store.listAssignments(profile.id), store.listOrganizations(), store.listClients(), store.listTasks(),
  ]);
  const allowedOrgIds = new Set(assignments.map((item) => item.organizationId));
  const organizations = allOrganizations.filter((item) => allowedOrgIds.has(item.id) && item.active);
  const clientIds = new Set(organizations.map((item) => item.clientId));
  const clientNames = new Map(allClients.filter((item) => clientIds.has(item.id)).map((item) => [item.id, item.clientName]));
  const tasks = allTasks.filter((task) => allowedOrgIds.has(task.organizationId));
  const profiles = await Promise.all(organizations.map((organization) => store.getContentProfile(organization.id)));
  const profilesByOrg = new Map(profiles.filter(Boolean).map((item) => [item!.organizationId, item!]));
  const today = chinaDate();

  return (
    <main className="operator-shell">
      <header className="operator-topbar"><div><p>门店线上运营与 AI 搜索优化</p><h1>运营人员工作台</h1></div><div><span>{profile.storeName || profile.phone}</span><form action={logout}><button className="ops-button ops-button-secondary" type="submit">退出登录</button></form></div></header>
      <div className="operator-content">
        <section className="operator-welcome"><div><p>{today}</p><h2>今天的机构与任务</h2><span>你只能看到管理员分配给自己的机构。合同、费用、收款和系统配置不会在此页面返回。</span></div><strong>{tasks.filter((task) => ["待生成", "待处理"].includes(task.status)).length}<small>待处理任务</small></strong></section>
        {organizations.length === 0 ? <EmptyState title="暂未分配机构" description="请联系管理员在系统管理中为当前账号分配机构。" /> : (
          <div className="operator-orgs">{organizations.map((organization) => {
            const orgTasks = tasks.filter((task) => task.organizationId === organization.id);
            const contentProfile = profilesByOrg.get(organization.id);
            return (
              <section className="operator-org" key={organization.id}>
                <div className="operator-org-title"><div><p>{clientNames.get(organization.clientId)}</p><h2>{organization.organizationName}</h2><span>{organization.description || "暂无机构说明"}</span></div><strong>{orgTasks.length}<small>项任务</small></strong></div>
                <div className="ops-two-column balanced">
                  <Panel title="机构任务">
                    {orgTasks.length ? <div className="ops-list">{orgTasks.map((task) => <form action={updateAssignedTask} className="operator-task" key={task.id}><input name="taskId" type="hidden" value={task.id} /><div><strong>{task.title}</strong><small>{task.scheduledDate || task.dueDate || "未安排日期"} · {task.relatedPlatform || "未指定平台"}</small><p>{task.description}</p></div><StatusBadge status={task.status} /><select name="status" defaultValue={task.status}>{opsTaskStatuses.map((status) => <option key={status}>{status}</option>)}</select><button className="ops-button ops-button-primary small" type="submit">更新状态</button></form>)}</div> : <EmptyState compact title="暂无机构任务" description="管理员新增任务后会显示在这里" />}
                    <form action={addAssignedTaskLog} className="ops-form-grid compact operator-log-form"><input name="clientId" type="hidden" value={organization.clientId} /><input name="organizationId" type="hidden" value={organization.id} /><Field label="记录类型"><select name="logType"><option>工作记录</option><option>客户反馈</option><option>临时任务</option><option>沟通记录</option></select></Field><Field label="记录内容"><input name="content" required /></Field><Field wide label="下一步"><input name="nextAction" /></Field><div className="ops-form-actions wide"><button className="ops-button ops-button-secondary" type="submit">添加工作记录</button></div></form>
                  </Panel>
                  <Panel title="机构内容资料">
                    <form action={saveAssignedContentProfile} className="ops-form-grid compact"><input name="organizationId" type="hidden" value={organization.id} /><Field wide label="详细介绍"><textarea name="detailedIntro" rows={3} defaultValue={contentProfile?.detailedIntro} /></Field><Field wide label="服务项目"><textarea name="services" rows={3} defaultValue={contentProfile?.services} /></Field><Field wide label="真实优势"><textarea name="realAdvantages" rows={3} defaultValue={contentProfile?.realAdvantages} /></Field><Field label="写作风格"><textarea name="writingStyle" rows={3} defaultValue={contentProfile?.writingStyle} /></Field><Field label="禁用词"><textarea name="bannedWords" rows={3} defaultValue={contentProfile?.bannedWords} /></Field><Field wide label="关键词"><textarea name="keywords" rows={3} defaultValue={contentProfile?.keywords} /></Field><div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存机构资料</button></div></form>
                  </Panel>
                </div>
              </section>
            );
          })}</div>
        )}
      </div>
    </main>
  );
}
