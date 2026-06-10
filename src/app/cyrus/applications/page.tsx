import { AdminShell } from "@/components/admin/AdminShell";
import { ApplicationManagement } from "@/components/admin/ApplicationManagement";
import { requireAdmin } from "@/lib/auth/session";
import { mockStore } from "@/lib/data/store";

export default async function AdminApplicationsPage() {
  const profile = await requireAdmin();

  return (
    <AdminShell profile={profile}>
      <ApplicationManagement applications={mockStore.listApplications()} />
    </AdminShell>
  );
}

