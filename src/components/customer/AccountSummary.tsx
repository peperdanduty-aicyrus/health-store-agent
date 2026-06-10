import { getPlanConfig } from "@/lib/domain/plans";
import type { Profile } from "@/lib/data/types";

export function AccountSummary({ profile }: { profile: Profile }) {
  const plan = getPlanConfig(profile.planName);

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-coral">账号信息</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{profile.storeName}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info label="手机号" value={profile.phone} />
        <Info label="门店类型" value={profile.storeType} />
        <Info label="城市 / 区域" value={profile.cityArea} />
        <Info label="套餐" value={plan.label} />
        <Info label="会员状态" value={profile.memberStatus} />
        <Info label="到期时间" value={profile.expiresAt} />
        <Info label="每日次数" value={`${plan.dailyLimit} 次`} />
        <Info label="主营项目" value={profile.mainProjects || "未填写"} />
      </div>
    </section>
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
