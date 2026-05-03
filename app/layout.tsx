import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileBottomTabs } from "@/components/layout/MobileBottomTabs";

export const metadata: Metadata = {
  title: "irytour.com 인천로열투어 관리자",
  description: "여행사 반응형 관리자 웹 애플리케이션",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppSidebar />
        <div className="min-h-screen pb-16 lg:pb-0 lg:pl-64">{children}</div>
        <MobileBottomTabs />
      </body>
    </html>
  );
}
