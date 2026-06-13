import type { Metadata } from "next";
import { WorkbenchHistoryList } from "@/components/workbench/WorkbenchHistoryList";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";
import { requireWorkbenchAccount } from "@/lib/auth/workbench-session";
import { getDataStore } from "@/lib/data/repository";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "历史记录｜雷鸣磊副业运营工作台",
};

export default async function WorkbenchHistoryPage() {
  const account = await requireWorkbenchAccount();
  const store = await getDataStore();
  const records =
    account.role === "owner"
      ? await store.listWorkbenchGenerations()
      : await store.listWorkbenchGenerations({ accountId: account.id });

  return (
    <WorkbenchShell account={account}>
      <h2 className="mb-5 text-2xl font-semibold text-ink">历史记录</h2>
      <WorkbenchHistoryList account={account} records={records} />
    </WorkbenchShell>
  );
}
