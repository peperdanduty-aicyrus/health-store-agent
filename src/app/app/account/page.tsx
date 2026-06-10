import { AccountSummary } from "@/components/customer/AccountSummary";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { requireUser } from "@/lib/auth/session";

export default async function AccountPage() {
  const profile = await requireUser();

  return (
    <CustomerShell profile={profile}>
      <AccountSummary profile={profile} />
    </CustomerShell>
  );
}
