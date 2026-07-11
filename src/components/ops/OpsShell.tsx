"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  ContactRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { logoutWorkbench } from "@/app/lvminglei/actions";
import type { WorkbenchAccount } from "@/lib/data/types";

const mainNav = [
  { href: "/lvminglei", label: "总览", icon: LayoutDashboard },
  { href: "/lvminglei/clients", label: "客户管理", icon: UsersRound },
  { href: "/lvminglei/organizations", label: "机构管理", icon: Building2 },
  { href: "/lvminglei/tasks", label: "任务管理", icon: ClipboardList },
  { href: "/lvminglei/calendar", label: "月历", icon: CalendarDays },
  { href: "/lvminglei/revenue", label: "营收管理", icon: CircleDollarSign },
  { href: "/lvminglei/subscriptions", label: "会员到期", icon: ContactRound },
];

const utilityNav = [
  { href: "/agent-admin/operators", label: "运营人员入口", icon: UsersRound },
  { href: "/agent-admin", label: "系统管理", icon: Settings },
];

const mobileNav = [mainNav[0], mainNav[1], mainNav[3], mainNav[4], { href: "/lvminglei/organizations", label: "更多", icon: Menu }];

export function OpsShell({ account, children }: { account: WorkbenchAccount; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="ops-app-shell">
      <aside className="ops-sidebar">
        <Link className="ops-brand" href="/lvminglei" aria-label="运营总控台首页">
          <span className="ops-brand-mark">营</span>
          <span>运营总控台</span>
        </Link>
        <nav className="ops-sidebar-nav" aria-label="运营总控台导航">
          {mainNav.map((item) => <NavItem currentPath={pathname} item={item} key={item.href} />)}
        </nav>
        <nav className="ops-sidebar-nav ops-sidebar-utility" aria-label="系统入口">
          {utilityNav.map((item) => <NavItem currentPath={pathname} item={item} key={item.href} />)}
        </nav>
      </aside>
      <main className="ops-main">
        <header className="ops-topbar">
          <div>
            <p className="ops-topbar-label">门店线上运营与 AI 搜索优化</p>
            <h1>运营总控台</h1>
          </div>
          <div className="ops-owner-chip">
            <span>{account.displayName}</span>
            <span className="ops-owner-role">超级管理员</span>
            <form action={logoutWorkbench}>
              <button className="ops-icon-button" aria-label="退出登录" title="退出登录" type="submit">
                <LogOut size={18} />
              </button>
            </form>
          </div>
          <Menu className="ops-mobile-menu" size={26} aria-hidden="true" />
        </header>
        <div className="ops-content">{children}</div>
      </main>
      <nav className="ops-mobile-nav" aria-label="手机端导航">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link className={active ? "active" : ""} href={item.href} key={item.href}>
              <Icon size={20} />
              <span>{item.label.replace("管理", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavItem({ currentPath, item }: { currentPath: string; item: (typeof mainNav)[number] }) {
  const Icon = item.icon;
  const active = isActive(currentPath, item.href);
  return (
    <Link className={`ops-nav-item${active ? " active" : ""}`} href={item.href}>
      <Icon size={19} />
      <span>{item.label}</span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/lvminglei" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
