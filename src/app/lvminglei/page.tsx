import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CircleCheck, ClipboardList } from "lucide-react";
import { WorkbenchLoginForm } from "@/components/workbench/WorkbenchLoginForm";
import { OpsCalendar } from "@/components/ops/OpsCalendar";
import { EmptyState, Panel, PageHeader, StatusBadge } from "@/components/ops/OpsUi";
import { getCurrentWorkbenchAccount } from "@/lib/auth/workbench-session";
import { calculateOpsDashboardMetrics } from "@/lib/ops/dashboard";
import { chinaDate, currentChinaMonth, monthRange } from "@/lib/ops/date";
import { getOpsStore } from "@/lib/ops/repository";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "运营总控台",
};

export default async function OpsDashboardPage() {
  const account = await getCurrentWorkbenchAccount();
  if (!account) {
    return <main className="ops-login-page"><div className="ops-login-wrap"><WorkbenchLoginForm /></div></main>;
  }
  if (account.role !== "owner") return null;

  const store = await getOpsStore();
  const month = currentChinaMonth();
  const range = monthRange(month);
  const [clients, payments, tasks, subscriptions, agreements] = await Promise.all([
    store.listClients(), store.listPayments(), store.listTasks({ periodStart: range.start, periodEnd: range.end }),
    store.listSubscriptions(), store.listAgreements(),
  ]);
  const metrics = calculateOpsDashboardMetrics(clients, payments, tasks);
  const today = chinaDate();
  const todayTasks = tasks.filter((task) => (task.scheduledDate || task.dueDate) === today);
  const upcomingSubscriptions = subscriptions.filter((item) => item.expiryDate >= today).slice(0, 5);
  const cards = [
    { label: "本月任务数", value: String(metrics.tasksThisMonth), icon: ClipboardList },
    { label: "已完成", value: String(metrics.completedTasks), icon: CircleCheck },
    { label: "待处理", value: String(metrics.pendingTasks), icon: CalendarDays },
  ];
  const recentTasks = [...tasks].sort((left, right) => (right.updatedAt || right.createdAt).localeCompare(left.updatedAt || left.createdAt)).slice(0, 5);

  return (
    <>
      <PageHeader title="总览" description="所有数字均来自当前预览数据库；没有记录时保持真实空状态。" actionHref="/lvminglei/tasks/new" actionLabel="新增任务" />
      <section className="ops-task-kpi-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="ops-kpi" key={label}><Icon size={23} /><span>{label}</span><strong>{value}</strong></article>
        ))}
      </section>
      <Panel title={`${month.slice(0, 4)}年${Number(month.slice(5))}月`} action={<a className="ops-text-link" href="/lvminglei/calendar">查看完整月历</a>}>
        <OpsCalendar month={month} tasks={tasks} subscriptions={subscriptions} agreements={agreements} />
      </Panel>
      <section className="ops-dashboard-lists">
        <Panel title="今日待办" action={<Link className="ops-button ops-button-primary small" href="/lvminglei/tasks/new">新增任务</Link>}>
          {todayTasks.length ? <div className="ops-list">{todayTasks.map((task) => <a className="ops-list-row" href={`/lvminglei/tasks/${task.id}`} key={task.id}><span><strong>{task.title}</strong><small>{task.taskType}</small></span><StatusBadge status={task.status} /></a>)}</div> : <EmptyState compact title="暂无待办任务" description="轻松一下，或创建今日计划" />}
        </Panel>
        <Panel title="即将到期">
          {upcomingSubscriptions.length ? <div className="ops-list">{upcomingSubscriptions.map((item) => <a className="ops-list-row" href="/lvminglei/subscriptions" key={item.id}><span><strong>{item.serviceName}</strong><small>{item.expiryDate}</small></span></a>)}</div> : <EmptyState compact title="暂无即将到期的内容" description="到期提醒会显示在这里" />}
        </Panel>
        <Panel title="最近任务" action={<Link className="ops-text-link" href="/lvminglei/tasks">查看全部</Link>}>
          {recentTasks.length ? <div className="ops-list">{recentTasks.map((task) => <a className="ops-list-row" href={`/lvminglei/tasks/${task.id}`} key={task.id}><span><strong>{task.title}</strong><small>{task.relatedPlatform || task.taskType}</small></span><StatusBadge status={task.status} /></a>)}</div> : <EmptyState compact title="暂无任务" description="创建任务后会显示在这里" />}
        </Panel>
      </section>
    </>
  );
}
