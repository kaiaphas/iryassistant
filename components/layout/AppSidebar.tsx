"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getNavItemsByRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCurrentAuth } from "@/lib/client-auth";
import { GuardedLink, useUnsavedChanges } from "@/lib/unsaved-changes";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useCurrentAuth();
  const { confirmNavigation, clearUnsavedChanges } = useUnsavedChanges();
  const navItems = getNavItemsByRole(auth.role);
  const roleLabel = auth.role === "admin" ? "관리자" : "담당자";

  async function logout() {
    if (!confirmNavigation()) return;
    clearUnsavedChanges();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="group/sidebar fixed inset-y-0 left-0 z-30 hidden w-16 flex-col overflow-hidden bg-emerald-950 text-white shadow-xl transition-[width] duration-200 hover:w-64 lg:flex">
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <GuardedLink
              key={item.href}
              href={item.href}
              title={item.title}
              className={cn(
                "flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-100 transition group-hover/sidebar:justify-start",
                active ? "bg-emerald-700 text-white shadow" : "hover:bg-emerald-900 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden whitespace-nowrap group-hover/sidebar:inline">{item.title}</span>
            </GuardedLink>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-emerald-900 p-3 text-xs text-emerald-200">
        <div className="flex h-9 items-center justify-center rounded-lg bg-emerald-900/70 font-semibold group-hover/sidebar:justify-start group-hover/sidebar:px-3">
          <span className="group-hover/sidebar:hidden">{roleLabel.slice(0, 1)}</span>
          <span className="hidden whitespace-nowrap group-hover/sidebar:inline">{roleLabel}</span>
        </div>
        {auth.email ? <div className="mt-1 hidden truncate px-3 group-hover/sidebar:block">{auth.email}</div> : null}
        <button
          type="button"
          title="로그아웃"
          onClick={logout}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-900 hover:text-white group-hover/sidebar:justify-start"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="hidden whitespace-nowrap group-hover/sidebar:inline">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
