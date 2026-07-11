import type { ReactNode } from "react";
import { OpsShell } from "@/components/ops/OpsShell";
import { getCurrentWorkbenchAccount } from "@/lib/auth/workbench-session";
import { calculateOpsDashboardMetrics } from "@/lib/ops/dashboard";
import { monthRange, currentChinaMonth } from "@/lib/ops/date";
import { getOpsStore } from "@/lib/ops/repository";

export default async function OpsControlCenterLayout({ children }: { children: ReactNode }) {
  const account = await getCurrentWorkbenchAccount();
  if (!account) return children;
  if (account.role !== "owner") {
    return (
      <main className="ops-login-page">
        <section className="ops-login-card">
          <h1>无法访问运营总控台</h1>
          <p>该入口仅供超级管理员使用。运营人员请使用运营工作台账号登录。</p>
          <a className="ops-button ops-button-primary" href="/login">前往运营人员登录</a>
        </section>
      </main>
    );
  }
  const store = await getOpsStore();
  const range = monthRange(currentChinaMonth());
  const [clients, payments, tasks] = await Promise.all([
    store.listClients(),
    store.listPayments(),
    store.listTasks({ periodStart: range.start, periodEnd: range.end }),
  ]);
  const overview = calculateOpsDashboardMetrics(clients, payments, tasks);
  return <OpsShell account={account} overview={overview}>{children}</OpsShell>;
}
