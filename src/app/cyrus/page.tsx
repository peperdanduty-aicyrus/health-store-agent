import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminShell } from "@/components/admin/AdminShell";
import { LoginForm } from "@/components/customer/LoginForm";
import { getCurrentProfile } from "@/lib/auth/session";
import { mockStore } from "@/lib/data/store";

export default async function CyrusPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return (
      <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-md">
          <p className="mb-3 text-sm font-semibold text-coral">管理员后台</p>
          <LoginForm />
        </div>
      </main>
    );
  }

  return (
    <AdminShell profile={profile}>
      <AdminDashboard generations={mockStore.listGenerations()} users={mockStore.listUsers()} />
    </AdminShell>
  );
}

