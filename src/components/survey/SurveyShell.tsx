import Link from "next/link";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { logoutSurveyStaff } from "@/app/survey-actions";
import type { SurveyStaffAccount } from "@/lib/survey/types";

const navItems = [
  { href: "/yingyun", label: "首页" },
  { href: "/yingyun/submissions", label: "填报" },
  { href: "/yingyun/pos", label: "POS" },
  { href: "/yingyun/trends", label: "趋势" },
  { href: "/yingyun/warnings", label: "预警" },
  { href: "/yingyun/stores", label: "门店" },
  { href: "/yingyun/follow-ups", label: "跟进" },
  { href: "/yingyun/periods", label: "月份" },
  { href: "/yingyun/reports", label: "报告" },
  { href: "/yingyun/exports", label: "导出" },
  { href: "/cyrus", label: "总后台" },
];

export function SurveyShell({ children, staff, title }: { children: ReactNode; staff: SurveyStaffAccount; title: string }) {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm text-white/58">
              {staff.displayName} · {staff.loginName} · {staff.role === "super_admin" ? "总管理员" : "营运"}
            </p>
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link key={item.href} className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium" href={item.href}>
                {item.label}
              </Link>
            ))}
            <form action={logoutSurveyStaff}>
              <button
                aria-label="退出登录"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-medium"
                title="退出登录"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">{children}</div>
    </main>
  );
}
