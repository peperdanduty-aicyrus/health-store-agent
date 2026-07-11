import { Building2 } from "lucide-react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getOpsStore } from "@/lib/ops/repository";

export default async function OrganizationsPage() {
  await requireWorkbenchOwner();
  const store = await getOpsStore();
  const [organizations, clients] = await Promise.all([store.listOrganizations(), store.listClients()]);
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  return (
    <>
      <PageHeader title="机构管理" description="一个客户可以包含多个门店、医院、养老院或其他运营机构。" />
      {organizations.length ? <div className="ops-client-list">{organizations.map((organization) => (
        <a className="ops-client-row" href={`/lvminglei/organizations/${organization.id}`} key={organization.id}>
          <span className="ops-client-avatar"><Building2 size={20} /></span>
          <span className="ops-client-main"><strong>{organization.organizationName}</strong><small>{clientsById.get(organization.clientId)?.clientName || "客户已不存在"}</small></span>
          <span className="ops-client-meta">{organization.organizationType || "未填写机构类型"}</span>
          <StatusBadge status={organization.active ? "启用" : "停用"} />
        </a>
      ))}</div> : <EmptyState title="还没有机构" description="请先在客户详情页中添加机构。" />}
    </>
  );
}
