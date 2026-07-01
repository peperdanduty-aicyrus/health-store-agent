import type { GenerationRecord, Profile } from "@/lib/data/types";
import { isBillableGeneration } from "@/lib/ai/generation-record";

export function AdminDashboard({ generations, users }: { generations: GenerationRecord[]; users: Profile[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayGenerations = generations.filter(
    (record) => record.createdAt.slice(0, 10) === today && isBillableGeneration(record),
  );
  const activeUserIds = new Set(todayGenerations.map((record) => record.userId));
  const paidUsers = users.filter((user) => user.memberStatus === "paid" && user.role === "user");
  const expiredUsers = users.filter((user) => user.memberStatus === "expired");

  const cards = [
    ["今日生成总次数", todayGenerations.length],
    ["今日活跃用户数", activeUserIds.size],
    ["当前正式客户数", paidUsers.length],
    ["已过期用户数", expiredUsers.length],
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold text-ink">数据概览</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
