import { TaskForm } from "@/components/ops/TaskForm";
import { PageHeader, Panel } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getDataStore } from "@/lib/data/repository";
import { getOpsStore } from "@/lib/ops/repository";

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ clientId?: string; organizationId?: string }> }) {
  await requireWorkbenchOwner();
  const defaults = await searchParams;
  const [opsStore, dataStore] = await Promise.all([getOpsStore(), getDataStore()]);
  const [clients, organizations, users] = await Promise.all([
    opsStore.listClients(), opsStore.listOrganizations(), dataStore.listUsers(),
  ]);
  return <><PageHeader title="新增任务" description="任务保存后会立即进入列表与月历。" /><Panel><TaskForm clients={clients} organizations={organizations} operators={users.filter((user) => user.role === "user" && !user.disabled)} defaults={defaults} /></Panel></>;
}
