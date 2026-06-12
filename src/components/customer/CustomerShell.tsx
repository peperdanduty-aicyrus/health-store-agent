import Link from "next/link";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { logout } from "@/app/actions";
import type { Profile } from "@/lib/data/types";

const navItems = [
  { href: "/app", label: "功能" },
  { href: "/app/history", label: "历史" },
  { href: "/app/account", label: "账号" },
];

export function CustomerShell({ children, profile }: { children: ReactNode; profile: Profile }) {
  const storeName = profile.storeName.trim() === "测试" ? "体验门店" : profile.storeName;

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm text-ink/58">{storeName}</p>
            <h1 className="text-xl font-semibold text-ink">本地健康门店获客助手</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link key={item.href} className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-medium" href={item.href}>
                {item.label}
              </Link>
            ))}
            <form action={logout}>
              <button
                aria-label="退出登录"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink"
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
