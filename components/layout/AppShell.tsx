"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomTabs } from "@/components/layout/MobileBottomTabs";
import { UnsavedChangesProvider } from "@/lib/unsaved-changes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authPage = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/auth/callback");

  if (authPage) {
    return <>{children}</>;
  }

  return (
    <UnsavedChangesProvider>
      <AppSidebar />
      <div className="min-h-screen pb-16 lg:pb-0 lg:pl-16">{children}</div>
      <MobileBottomTabs />
    </UnsavedChangesProvider>
  );
}
