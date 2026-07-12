import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OpsCalendar } from "@/components/ops/OpsCalendar";
import { PageHeader, Panel } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";
import { currentChinaMonth, monthRange } from "@/lib/ops/date";
import { getOpsStore } from "@/lib/ops/repository";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireWorkbenchOwner();
  const requested = (await searchParams).month;
  const month = /^\d{4}-\d{2}$/.test(requested || "") ? requested! : currentChinaMonth();
  const range = monthRange(month);
  const store = await getOpsStore();
  const [tasks, contentTasks, subscriptions, agreements] = await Promise.all([
    store.listTasks({ periodStart: range.start, periodEnd: range.end }),
    store.listContentTasks({ periodStart: range.start, periodEnd: range.end }),
    store.listSubscriptions(), store.listAgreements(),
  ]);
  const [year, monthNumber] = month.split("-").map(Number);
  const previous = monthValue(year, monthNumber - 1);
  const next = monthValue(year, monthNumber + 1);
  return (
    <>
      <PageHeader title="月历" description="统一查看任务、交付、发布、结算、合同与软件会员到期。" actionHref="/lvminglei/tasks/new" actionLabel="新增任务" />
      <Panel title={`${year}年${monthNumber}月`} action={<div className="ops-month-switch"><Link href={`/lvminglei/calendar?month=${previous}`} aria-label="上个月"><ChevronLeft size={18} /></Link><Link href={`/lvminglei/calendar?month=${next}`} aria-label="下个月"><ChevronRight size={18} /></Link></div>}>
        <OpsCalendar month={month} tasks={tasks} contentTasks={contentTasks} subscriptions={subscriptions} agreements={agreements} />
      </Panel>
    </>
  );
}

function monthValue(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
