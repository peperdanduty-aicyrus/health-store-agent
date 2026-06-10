import { AdminShell } from "@/components/admin/AdminShell";
import { UserManagement } from "@/components/admin/UserManagement";
import { requireAdmin } from "@/lib/auth/session";
import { mockStore } from "@/lib/data/store";

export default async function AdminUsersPage() {
  const profile = await requireAdmin();

  return (
    <AdminShell profile={profile}>
      <UserManagement users={mockStore.listUsers()} />
    </AdminShell>
  );
}

