import Link from "next/link";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { logoutWorkbench } from "@/app/lvminglei/actions";
import type { WorkbenchAccount } from "@/lib/data/types";

const navItems = [
  { href: "/lvminglei", label: "工作台" },
  { href: "/lvminglei/history", label: "历史" },
  { href: "/lvminglei/accounts", label: "账号管理", ownerOnly: true },
];

export function WorkbenchShell({ account, children }: { account: WorkbenchAccount; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm text-ink/58">{account.role === "owner" ? "主账号" : "子账号"}：{account.displayName}</p>
            <h1 className="text-xl font-semibold text-ink">吕明磊副业运营工作台</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems
              .filter((item) => !item.ownerOnly || account.role === "owner")
              .map((item) => (
                <Link key={item.href} className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-medium" href={item.href}>
                  {item.label}
                </Link>
              ))}
            <form action={logoutWorkbench}>
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
