import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CreateMerchantForm } from "@/components/admin/CreateMerchantForm";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function NewUserPage({ searchParams }: { searchParams: Promise<{ applicationId?: string }> }) {
  const profile = await requireAdmin();
  const { applicationId } = await searchParams;
  const store = await getDataStore();
  const application = applicationId
    ? (await store.listApplications()).find((item) => item.id === applicationId)
    : undefined;

  return (
    <AdminShell profile={profile}>
      <div className="mb-5 flex flex-col gap-2">
        <Link className="text-sm font-medium text-moss" href="/agent-admin/applications">
          返回线索
        </Link>
        <h2 className="text-2xl font-semibold text-ink">新增用户 / 开通账号</h2>
      </div>
      <CreateMerchantForm application={application} />
    </AdminShell>
  );
}
