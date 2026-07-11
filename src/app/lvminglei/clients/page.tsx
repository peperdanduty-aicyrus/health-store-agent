import Link from "next/link";
import { Building2, MapPin, UsersRound } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getOpsStore } from "@/lib/ops/repository";

export default async function ClientsPage() {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const [clients, organizations] = await Promise.all([store.listClients(), store.listOrganizations()]);
  return (
    <>
      <PageHeader title="客户管理" description="维护客户主体、合作状态、机构与日常运营资料。" actionHref="/lvminglei/clients/new" actionLabel="新增客户" />
      {clients.length ? (
        <div className="ops-client-list">
          {clients.map((client) => {
            const orgCount = organizations.filter((item) => item.clientId === client.id).length;
            return (
              <Link className="ops-client-row" href={`/lvminglei/clients/${client.id}`} key={client.id}>
                <span className="ops-client-avatar"><UsersRound size={20} /></span>
                <span className="ops-client-main"><strong>{client.clientName}</strong><small>{client.brandName || "未填写品牌名"}</small></span>
                <span className="ops-client-meta"><MapPin size={15} />{client.city || "城市未填写"}</span>
                <span className="ops-client-meta"><Building2 size={15} />{orgCount} 个机构</span>
                <StatusBadge status={client.active ? client.cooperationStatus : "已停用"} />
              </Link>
            );
          })}
        </div>
      ) : <EmptyState title="还没有客户资料" description="新增第一个客户后，机构、任务、营收和汇报都会围绕真实资料展开。" />}
    </>
  );
}
