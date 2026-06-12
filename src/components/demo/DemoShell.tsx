import Link from "next/link";
import type { ReactNode } from "react";

export function DemoShell({ children, remaining }: { children: ReactNode; remaining: number }) {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm text-ink/58">免登录 Demo</p>
            <h1 className="text-xl font-semibold text-ink">本地健康门店获客助手</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-moss/20 bg-moss/10 px-3 py-2 text-sm font-medium text-moss">
              今日剩余 {remaining} 次
            </span>
            <Link className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-medium" href="/demo">
              Demo 首页
            </Link>
            <Link className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm font-medium" href="/login">
              正式登录
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">{children}</div>
    </main>
  );
}
