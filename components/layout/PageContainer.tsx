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
      <main className="px-3 py-3 sm:px-4 lg:px-5">{children}</main>
    </>
  );
}
