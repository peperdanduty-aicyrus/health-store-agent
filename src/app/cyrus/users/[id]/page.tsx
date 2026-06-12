import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerAccountActions } from "@/components/admin/CustomerAccountActions";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPlanConfig } from "@/lib/domain/plans";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const store = await getDataStore();
  const user = await store.getUserById(id);

  if (!user || user.role !== "user") {
    notFound();
  }

  const generations = await store.listGenerations({ userId: user.id });

  return (
    <AdminShell profile={admin}>
      <div className="mb-5 flex flex-col gap-2">
        <Link className="text-sm font-medium text-moss" href="/cyrus/users">
          返回账号
        </Link>
        <h2 className="text-2xl font-semibold text-ink">{user.storeName}</h2>
      </div>

      <section className="mb-5 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="手机号" value={user.phone} />
          <Info label="套餐" value={getPlanConfig(user.planName).label} />
          <Info label="状态" value={user.disabled ? "已禁用" : user.memberStatus} />
          <Info label="到期时间" value={user.expiresAt} />
          <Info label="门店类型" value={user.storeType} />
          <Info label="城市 / 区域" value={user.cityArea} />
          <Info label="每日次数" value={`${user.dailyLimit} 次`} />
          <Info label="生成记录" value={`${generations.length} 条`} />
        </div>
      </section>

      <CustomerAccountActions user={user} />
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-3">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
