import { AdminShell } from "@/components/admin/AdminShell";
import { UserManagement } from "@/components/admin/UserManagement";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";
import { isBillableGeneration } from "@/lib/ai/generation-record";

export default async function AdminUsersPage() {
  const profile = await requireAdmin();
  const store = await getDataStore();
  const [users, generations] = await Promise.all([store.listUsers(), store.listGenerations()]);
  const today = new Date().toISOString().slice(0, 10);
  const todayCounts = generations.reduce<Record<string, number>>((counts, record) => {
    if (record.createdAt.slice(0, 10) === today && isBillableGeneration(record)) {
      counts[record.userId] = (counts[record.userId] || 0) + 1;
    }
    return counts;
  }, {});

  return (
    <AdminShell profile={profile}>
      <UserManagement todayCounts={todayCounts} users={users} />
    </AdminShell>
  );
}
