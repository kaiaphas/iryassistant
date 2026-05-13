"use client";

import { UserRound } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useCurrentAuth } from "@/lib/client-auth";

export function AppHeader(props: { title: string; description?: string }) {
  void props;
  const auth = useCurrentAuth();
  const roleLabel = auth.role === "admin" ? "관리자" : "담당자";

  return (
    <header className="sticky top-0 z-30 border-b bg-emerald-950 text-white backdrop-blur lg:hidden">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <MobileNav />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden gap-1.5 rounded-md bg-white px-3 py-1.5 text-slate-800 sm:inline-flex lg:hidden">
            <UserRound className="h-4 w-4" />
            {roleLabel}
          </Badge>
          <div className="lg:hidden">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
