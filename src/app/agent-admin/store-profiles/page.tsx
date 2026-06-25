import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function AdminStoreProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireAdmin();
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const store = await getDataStore();
  const [users, profiles] = await Promise.all([store.listUsers(), store.listStoreProfiles()]);
  const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
  const customers = users
    .filter((user) => user.role === "user")
    .filter((user) => {
      if (!query) {
        return true;
      }
      return [user.phone, user.storeName, user.storeType, user.cityArea]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  return (
    <AdminShell profile={admin}>
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-coral">客户店铺资料管理</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">查看和代填客户资料</h2>
          </div>
          <form className="flex gap-2" action="/agent-admin/store-profiles">
            <input
              className="min-h-11 rounded-md border border-ink/12 bg-white px-3 text-sm outline-none focus:border-moss"
              defaultValue={q}
              name="q"
              placeholder="搜索账号 / 手机号 / 店铺名称"
            />
            <button className="min-h-11 rounded-md bg-ink px-4 text-sm font-medium text-white" type="submit">
              搜索
            </button>
          </form>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-3 border-b border-ink/10 bg-paper px-4 py-3 text-xs font-semibold text-ink/58 max-lg:hidden">
            <span>客户</span>
            <span>手机号</span>
            <span>门店类型</span>
            <span>资料状态</span>
            <span>操作</span>
          </div>
          {customers.length === 0 ? (
            <p className="p-5 text-sm text-ink/62">暂无匹配客户。</p>
          ) : (
            customers.map((customer) => {
              const record = profileMap.get(customer.id);
              return (
                <div
                  className="grid gap-3 border-b border-ink/10 px-4 py-4 text-sm last:border-b-0 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] lg:items-center"
                  key={customer.id}
                >
                  <div>
                    <p className="font-medium text-ink">{customer.storeName}</p>
                    <p className="mt-1 text-xs text-ink/50">{customer.cityArea || "未填写区域"}</p>
                  </div>
                  <p className="text-ink/68">{customer.phone}</p>
                  <p className="text-ink/68">{customer.storeType}</p>
                  <p className={record ? "font-medium text-moss" : "font-medium text-ink/50"}>
                    {record ? `已填写：${new Date(record.updatedAt).toLocaleDateString("zh-CN")}` : "未填写"}
                  </p>
                  <Link className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-center text-sm font-medium text-ink" href={`/agent-admin/store-profiles/${customer.id}`}>
                    管理
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </section>
    </AdminShell>
  );
}
