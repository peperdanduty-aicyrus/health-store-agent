import Link from "next/link";
import type { ReactNode } from "react";
import type { Profile } from "@/lib/data/types";

const navItems = [
  { href: "/app", label: "功能" },
  { href: "/app/history", label: "历史" },
  { href: "/app/account", label: "账号" },
];

export function CustomerShell({ children, profile }: { children: ReactNode; profile: Profile }) {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm text-ink/58">{profile.storeName}</p>
            <h1 className="text-xl font-semibold text-ink">本地健康门店获客助手</h1>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link key={item.href} className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-medium" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">{children}</div>
    </main>
  );
}

