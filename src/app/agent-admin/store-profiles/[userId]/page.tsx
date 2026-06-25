import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStoreProfilePanel } from "@/components/store-profile/AdminStoreProfilePanel";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function AdminStoreProfileDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin();
  const { userId } = await params;
  const store = await getDataStore();
  const customer = await store.getUserById(userId);

  if (!customer || customer.role !== "user") {
    notFound();
  }

  const record = await store.getStoreProfileByUserId(customer.id);

  return (
    <AdminShell profile={admin}>
      <div className="mb-5">
        <Link className="text-sm font-medium text-moss" href="/agent-admin/store-profiles">
          返回客户店铺资料管理
        </Link>
      </div>
      <AdminStoreProfilePanel customer={customer} record={record} />
    </AdminShell>
  );
}
