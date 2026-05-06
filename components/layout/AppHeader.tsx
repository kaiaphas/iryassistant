"use client";

import { Bell, UserRound } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useCurrentAuth } from "@/lib/client-auth";

export function AppHeader({ title, description }: { title: string; description?: string }) {
  const auth = useCurrentAuth();
  const roleLabel = auth.role === "admin" ? "관리자" : "담당자";

  return (
    <header className="sticky top-0 z-30 border-b bg-emerald-950 text-white backdrop-blur lg:bg-background/90 lg:text-foreground">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <MobileNav />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1>
            {description ? <p className="hidden text-sm text-slate-500 lg:block">{description}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="알림">
            <Bell className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className="hidden gap-1.5 rounded-md bg-white px-3 py-1.5 text-slate-800 sm:inline-flex">
            <UserRound className="h-4 w-4" />
            {roleLabel}
          </Badge>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
