import type { Metadata } from "next";
import { WorkbenchAccountManagement } from "@/components/workbench/WorkbenchAccountManagement";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { getDataStore } from "@/lib/data/repository";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "账号管理｜吕明磊副业运营工作台",
};

export default async function WorkbenchAccountsPage() {
  const account = await requireWorkbenchOwner();
  const accounts = await (await getDataStore()).listWorkbenchAccounts();

  return (
    <WorkbenchShell account={account}>
      <h2 className="mb-5 text-2xl font-semibold text-ink">账号管理</h2>
      <WorkbenchAccountManagement accounts={accounts} />
    </WorkbenchShell>
  );
}
