import { AdminShell } from "@/components/admin/AdminShell";
import { ApplicationManagement } from "@/components/admin/ApplicationManagement";
import { requireAdmin } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function AdminApplicationsPage() {
  const profile = await requireAdmin();
  const store = await getDataStore();

  return (
    <AdminShell profile={profile}>
      <ApplicationManagement applications={await store.listApplications()} />
    </AdminShell>
  );
}
