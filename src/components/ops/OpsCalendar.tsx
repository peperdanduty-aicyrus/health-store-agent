import Link from "next/link";
import { EmptyState } from "./OpsUi";
import type { OpsContentTask, OpsServiceAgreement, OpsSubscription, OpsTask } from "@/lib/ops/types";

type CalendarEvent = { date: string; label: string; href: string; tone: string };

export function OpsCalendar({ month, tasks, contentTasks = [], subscriptions = [], agreements = [], compact = false }: {
  month: string;
  tasks: OpsTask[];
  contentTasks?: OpsContentTask[];
  subscriptions?: OpsSubscription[];
  agreements?: OpsServiceAgreement[];
  compact?: boolean;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const events: CalendarEvent[] = [
    ...tasks.map((task) => ({
      date: task.scheduledDate || task.dueDate,
      label: task.title,
      href: `/lvminglei/tasks/${task.id}`,
      tone: task.status === "已发布" ? "published" : task.status === "已交付" ? "delivered" : "task",
    })),
    ...contentTasks.map((task) => ({
      date: task.plannedGenerationDate || task.plannedPublishDate,
      label: `内容 · ${task.topic || "未命名选题"}`,
      href: `/lvminglei/content/drafts?taskId=${task.id}`,
      tone: task.status === "已发布" ? "published" : task.status === "已交付" ? "delivered" : "task",
    })),
    ...subscriptions.map((item) => ({ date: item.expiryDate, label: `${item.serviceName} 到期`, href: "/lvminglei/subscriptions", tone: "expiry" })),
    ...agreements.flatMap((item) => [
      item.serviceEndDate ? { date: item.serviceEndDate, label: "合同到期", href: `/lvminglei/clients/${item.clientId}`, tone: "expiry" } : null,
    ].filter(Boolean) as CalendarEvent[]),
  ].filter((event) => event.date.startsWith(month));
  const cells = Array.from({ length: offset + days }, (_, index) => index < offset ? null : index - offset + 1);

  if (compact) {
    return (
      <div className="ops-mini-calendar">
        <div className="ops-calendar-weekdays">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="ops-mini-grid">
          {cells.map((day, index) => {
            const date = day ? `${month}-${String(day).padStart(2, "0")}` : "";
            return <span className={events.some((event) => event.date === date) ? "has-event" : ""} key={`${day}-${index}`}>{day}</span>;
          })}
        </div>
        {events.length ? (
          <div className="ops-mini-events">{events.slice(0, 4).map((event) => <Link href={event.href} key={`${event.date}-${event.label}`}>{event.date.slice(8)}日 · {event.label}</Link>)}</div>
        ) : <EmptyState compact title="本月暂无任务安排" description="新增任务后会显示在月历中" />}
      </div>
    );
  }

  return (
    <div className="ops-calendar-wrap">
      <div className="ops-calendar-weekdays">{["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="ops-calendar-grid">
        {cells.map((day, index) => {
          const date = day ? `${month}-${String(day).padStart(2, "0")}` : "";
          const dayEvents = events.filter((event) => event.date === date);
          return (
            <div className={`ops-calendar-cell${day ? "" : " muted"}`} key={`${day}-${index}`}>
              {day ? <span className="ops-calendar-day">{day}</span> : null}
              <div className="ops-calendar-events">
                {dayEvents.map((event) => <Link className={`ops-calendar-event ${event.tone}`} href={event.href} key={`${event.date}-${event.label}`}>{event.label}</Link>)}
              </div>
            </div>
          );
        })}
      </div>
      {events.length === 0 ? <div className="ops-calendar-empty-overlay"><EmptyState compact title="本月暂无任务安排" description="点击“新增任务”开始创建" /></div> : null}
    </div>
  );
}
