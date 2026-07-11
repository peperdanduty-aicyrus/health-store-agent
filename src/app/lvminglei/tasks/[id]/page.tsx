import { notFound } from "next/navigation";
import { deleteOpsTask } from "@/app/lvminglei/actions";
import { TaskForm } from "@/components/ops/TaskForm";
import { PageHeader, Panel, StatusBadge } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getDataStore } from "@/lib/data/repository";
import { getOpsStore } from "@/lib/ops/repository";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireWorkbenchOwner();
  const { id } = await params;
  const opsStore = await getOpsStore();
  const task = await opsStore.getTask(id);
  if (!task) notFound();
  const [clients, organizations, users] = await Promise.all([opsStore.listClients(), opsStore.listOrganizations(), getDataStore().then((store) => store.listUsers())]);
  return (
    <>
      <PageHeader title={task.title} description="修改任务日期、状态、负责人和执行说明。" />
      <div className="ops-detail-toolbar"><StatusBadge status={task.status} /><form action={deleteOpsTask}><input name="id" type="hidden" value={task.id} /><button className="ops-button ops-button-danger" type="submit">删除任务</button></form></div>
      <Panel><TaskForm clients={clients} organizations={organizations} operators={users.filter((user) => user.role === "user" && !user.disabled)} task={task} /></Panel>
    </>
  );
}
