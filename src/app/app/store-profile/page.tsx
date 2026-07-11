import { CustomerShell } from "@/components/customer/CustomerShell";
import { CustomerStoreProfilePanel } from "@/components/store-profile/CustomerStoreProfilePanel";
import { requireUser } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";
import { redirect } from "next/navigation";

export default async function CustomerStoreProfilePage() {
  const profile = await requireUser();
  if (profile.storeType === "运营人员") redirect("/app");
  const store = await getDataStore();
  const record = await store.getStoreProfileByUserId(profile.id);

  return (
    <CustomerShell profile={profile}>
      <CustomerStoreProfilePanel record={record} />
    </CustomerShell>
  );
}
