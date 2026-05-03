"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, CalendarDays, CircleGauge, UserRound, UserRoundCog } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { title: "대시보드", href: "/", icon: CircleGauge },
  { title: "예약", href: "/reservations", icon: CalendarDays },
  { title: "가이드", href: "/guides", icon: UserRoundCog },
  { title: "차량", href: "/drivers", icon: Bus },
  { title: "마이페이지", href: "/members", icon: UserRound },
];

export function MobileBottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white px-1 py-1 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} className={cn("flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium", active ? "text-emerald-700" : "text-slate-500")}>
            <Icon className="h-4 w-4" />
            {tab.title}
          </Link>
        );
      })}
    </nav>
  );
}
