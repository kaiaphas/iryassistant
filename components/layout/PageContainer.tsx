import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";

export function PageContainer({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <>
      <AppHeader title={title} description={description} />
      <main className="px-4 py-5 sm:px-6 lg:px-8">{children}</main>
    </>
  );
}
