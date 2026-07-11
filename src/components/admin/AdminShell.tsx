import Link from "next/link";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { logout } from "@/app/actions";
import type { Profile } from "@/lib/data/types";

const navItems = [
  { href: "/agent-admin", label: "概览" },
  { href: "/agent-admin/users", label: "账号" },
  { href: "/agent-admin/operators", label: "运营分配" },
  { href: "/agent-admin/applications", label: "线索" },
  { href: "/agent-admin/generations", label: "记录" },
  { href: "/agent-admin/store-profiles", label: "资料" },
  { href: "/agent-admin/settings", label: "设置" },
];

export function AdminShell({ children, profile }: { children: ReactNode; profile: Profile }) {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm text-white/58">{profile.phone}</p>
            <h1 className="text-xl font-semibold">Agent 系统管理</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link key={item.href} className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium" href={item.href}>
                {item.label}
              </Link>
            ))}
            <form action={logout}>
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
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">{children}</div>
    </main>
  );
}
