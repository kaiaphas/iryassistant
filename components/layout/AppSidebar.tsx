"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-emerald-950 text-white lg:flex">
      <div className="px-6 py-6">
        <Link href="/" className="block text-xl font-bold tracking-tight">
          irytour<span className="font-normal text-emerald-200">.com</span>
        </Link>
        <p className="mt-1 text-xs text-emerald-200">인천로열투어 관리자</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-100 transition",
                active ? "bg-emerald-700 text-white shadow" : "hover:bg-emerald-900 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-emerald-900 p-4 text-xs text-emerald-200">
        mock data mode
      </div>
    </aside>
  );
}
