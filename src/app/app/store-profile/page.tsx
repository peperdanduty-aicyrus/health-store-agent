import { CustomerShell } from "@/components/customer/CustomerShell";
import { CustomerStoreProfilePanel } from "@/components/store-profile/CustomerStoreProfilePanel";
import { requireUser } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function CustomerStoreProfilePage() {
  const profile = await requireUser();
  const store = await getDataStore();
  const record = await store.getStoreProfileByUserId(profile.id);

  return (
    <CustomerShell profile={profile}>
      <CustomerStoreProfilePanel record={record} />
    </CustomerShell>
  );
}
