import { AdminShell } from "@/components/admin/AdminShell";
import { GenerationManagement } from "@/components/admin/GenerationManagement";
import { requireAdmin } from "@/lib/auth/session";
import { mockStore } from "@/lib/data/store";

export default async function AdminGenerationsPage() {
  const profile = await requireAdmin();

  return (
    <AdminShell profile={profile}>
      <GenerationManagement generations={mockStore.listGenerations()} />
    </AdminShell>
  );
}
