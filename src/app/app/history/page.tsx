import { CustomerShell } from "@/components/customer/CustomerShell";
import { HistoryList } from "@/components/customer/HistoryList";
import { requireUser } from "@/lib/auth/session";
import { getDataStore } from "@/lib/data/repository";

export default async function HistoryPage() {
  const profile = await requireUser();
  const store = await getDataStore();
  const records = await store.listGenerations({ userId: profile.id });

  return (
    <CustomerShell profile={profile}>
      <h2 className="mb-5 text-2xl font-semibold text-ink">生成历史</h2>
      <HistoryList records={records} />
    </CustomerShell>
  );
}
