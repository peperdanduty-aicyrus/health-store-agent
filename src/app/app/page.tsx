import { CustomerShell } from "@/components/customer/CustomerShell";
import { SceneCardGrid } from "@/components/customer/SceneCardGrid";
import { getDataStore } from "@/lib/data/repository";
import { requireUser } from "@/lib/auth/session";

export default async function CustomerAppPage() {
  const profile = await requireUser();
  const store = await getDataStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (await store.listGenerations({ userId: profile.id }))
    .filter((record) => record.createdAt.slice(0, 10) === today).length;

  return (
    <CustomerShell profile={profile}>
      <div className="mb-5 rounded-lg border border-ink/10 bg-white p-5">
        <p className="text-sm text-ink/58">今日已生成 {todayCount} 次</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">选择要生成的内容</h2>
      </div>
      <SceneCardGrid profile={profile} todayCount={todayCount} />
    </CustomerShell>
  );
}
