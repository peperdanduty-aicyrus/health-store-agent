import { AdminShell } from "@/components/admin/AdminShell";
import { GenerationManagement } from "@/components/admin/GenerationManagement";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function AdminGenerationsPage() {
  const profile = await requireAdmin();
  const store = await getDataStore();

  return (
    <AdminShell profile={profile}>
      <GenerationManagement generations={await store.listGenerations()} />
    </AdminShell>
  );
}
