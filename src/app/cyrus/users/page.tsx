import { AdminShell } from "@/components/admin/AdminShell";
import { UserManagement } from "@/components/admin/UserManagement";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function AdminUsersPage() {
  const profile = await requireAdmin();
  const store = await getDataStore();

  return (
    <AdminShell profile={profile}>
      <UserManagement users={await store.listUsers()} />
    </AdminShell>
  );
}
