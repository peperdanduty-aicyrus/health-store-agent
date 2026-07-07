import { CustomerShell } from "@/components/customer/CustomerShell";
import { SceneCardGrid } from "@/components/customer/SceneCardGrid";
import { getDataStore } from "@/lib/data/repository";
import { requireUser } from "@/lib/auth/session";
import { isBillableGeneration } from "@/lib/ai/generation-record";
import { getPlanConfig } from "@/lib/domain/plans";

export default async function CustomerAppPage() {
  const profile = await requireUser();
  const store = await getDataStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (await store.listGenerations({ userId: profile.id }))
    .filter((record) => record.createdAt.slice(0, 10) === today && isBillableGeneration(record)).length;

  return (
    <CustomerShell profile={profile}>
      <div className="mb-5 rounded-lg border border-ink/10 bg-white p-5">
        <h2 className="mt-1 text-2xl font-semibold text-ink">选择要生成的内容</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Status label="当前套餐" value={getPlanConfig(profile.planName).label} />
          <Status label="到期时间" value={profile.expiresAt} />
          <Status label="今日已生成次数" value={`${todayCount} 次`} />
          <Status label="门店类型" value={profile.storeType} />
        </div>
        {profile.planName === "temporary_opening" ? (
          <p className="mt-4 rounded-md bg-moss/10 p-3 text-sm leading-6 text-moss">
            当前为7天体验账号，满意后可开通正式套餐。好评后可联系管理员延长1个月。
          </p>
        ) : null}
      </div>
      <SceneCardGrid profile={profile} todayCount={todayCount} />
    </CustomerShell>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-3">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
