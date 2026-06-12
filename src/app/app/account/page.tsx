import { AccountSummary } from "@/components/customer/AccountSummary";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { PasswordChangeForm } from "@/components/shared/PasswordChangeForm";
import { requireUser } from "@/lib/auth/session";

export default async function AccountPage() {
  const profile = await requireUser();

  return (
    <CustomerShell profile={profile}>
      <div className="grid gap-5">
        <AccountSummary profile={profile} />
        <PasswordChangeForm />
      </div>
    </CustomerShell>
  );
}
