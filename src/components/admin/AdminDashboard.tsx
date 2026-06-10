import type { GenerationRecord, Profile } from "@/lib/data/types";

export function AdminDashboard({ generations, users }: { generations: GenerationRecord[]; users: Profile[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayGenerations = generations.filter((record) => record.createdAt.slice(0, 10) === today);
  const activeUserIds = new Set(todayGenerations.map((record) => record.userId));
  const trialUsers = users.filter((user) => user.memberStatus === "trial");
  const paidUsers = users.filter((user) => user.memberStatus === "paid" && user.role === "user");
  const expiredUsers = users.filter((user) => user.memberStatus === "expired");

  const cards = [
    ["今日生成总次数", todayGenerations.length],
    ["今日活跃用户数", activeUserIds.size],
    ["当前试用用户数", trialUsers.length],
    ["当前付费用户数", paidUsers.length],
    ["已过期用户数", expiredUsers.length],
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold text-ink">数据概览</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <p className="text-sm text-ink/55">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-coral">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

