import { EmptyState, PageHeader, StatusBadge } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getOpsStore } from "@/lib/ops/repository";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ organizationId?: string }> }) {
  await requireWorkbenchOwner();
  const { organizationId } = await searchParams;
  const store = await getOpsStore();
  const [tasks, clients, organizations] = await Promise.all([
    store.listTasks({ organizationId }), store.listClients(), store.listOrganizations(),
  ]);
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const orgsById = new Map(organizations.map((org) => [org.id, org]));
  return (
    <>
      <PageHeader title="任务管理" description="创建、修改、调整日期与状态；所有月历事项都来自这里。" actionHref="/lvminglei/tasks/new" actionLabel="新增任务" />
      {tasks.length ? <div className="ops-table-wrap"><table className="ops-table"><thead><tr>{["任务", "客户 / 机构", "日期", "平台", "负责人", "状态"].map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{tasks.map((task) => <tr key={task.id}><td><a href={`/lvminglei/tasks/${task.id}`}><strong>{task.title}</strong><small>{task.taskType}</small></a></td><td>{clientsById.get(task.clientId)?.clientName || "未知客户"}<small>{orgsById.get(task.organizationId)?.organizationName || "未知机构"}</small></td><td>{task.scheduledDate || "未计划"}<small>{task.dueDate ? `截止 ${task.dueDate}` : "无截止日期"}</small></td><td>{task.relatedPlatform || "—"}</td><td>{task.assignedUserId ? "已分配" : "未分配"}</td><td><StatusBadge status={task.status} /></td></tr>)}</tbody></table></div> : <EmptyState title="还没有任务" description="新增任务后可以在列表和月历中统一管理。" />}
    </>
  );
}
