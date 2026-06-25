import { AdminShell } from "@/components/admin/AdminShell";
import { PasswordChangeForm } from "@/components/shared/PasswordChangeForm";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminSettingsPage() {
  const profile = await requireAdmin();

  return (
    <AdminShell profile={profile}>
      <h2 className="mb-5 text-2xl font-semibold text-ink">账号设置</h2>
      <PasswordChangeForm />
    </AdminShell>
  );
}
