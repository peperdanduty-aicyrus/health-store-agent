import Link from "next/link";
import { CalendarDays, Inbox, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { OpsTaskStatus } from "@/lib/ops/types";

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="ops-page-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link className="ops-button ops-button-primary" href={actionHref}><Plus size={17} />{actionLabel}</Link>
      ) : null}
    </div>
  );
}

export function Panel({ children, title, action }: { children: ReactNode; title?: string; action?: ReactNode }) {
  return (
    <section className="ops-panel">
      {title || action ? <div className="ops-panel-header"><h3>{title}</h3>{action}</div> : null}
      {children}
    </section>
  );
}

export function EmptyState({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className={`ops-empty${compact ? " compact" : ""}`}>
      <span className="ops-empty-icon">{compact ? <CalendarDays size={25} /> : <Inbox size={30} />}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: OpsTaskStatus | string }) {
  const tone = status === "已发布" ? "published" : status === "已交付" ? "delivered" : status === "已完成" ? "completed" : status === "已作废" ? "cancelled" : "pending";
  return <span className={`ops-status ${tone}`}>{status}</span>;
}

export function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={`ops-field${wide ? " wide" : ""}`}><span>{label}</span>{children}</label>;
}

export function money(value: number) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(value);
}
