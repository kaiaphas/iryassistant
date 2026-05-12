import {
  Bus,
  CalendarDays,
  CarFront,
  CircleGauge,
  ClipboardList,
  Database,
  Hotel,
  ReceiptText,
  Soup,
  Settings,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

export const navItems = [
  { title: "대시보드", href: "/", icon: CircleGauge },
  { title: "예약현황", href: "/reservations", icon: ClipboardList },
  { title: "가이드관리", href: "/guides", icon: UserRoundCog },
  { title: "기사관리", href: "/drivers", icon: Bus },
  { title: "식당관리", href: "/restaurants", icon: Soup },
  { title: "호텔관리", href: "/hotels", icon: Hotel },
  { title: "환불명단", href: "/refunds", icon: ReceiptText },
  { title: "기준정보", href: "/codes", icon: Database },
  { title: "회원관리", href: "/members", icon: UsersRound },
  { title: "설정", href: "/settings", icon: Settings },
] as const;

export function getNavItemsByRole(role: "admin" | "staff") {
  if (role === "admin") return navItems;
  return navItems.filter((item) => ["/", "/reservations", "/restaurants", "/hotels", "/refunds"].includes(item.href));
}

export const codeCategories = [
  { group: "PRODUCT_CODE", label: "상품코드", icon: CalendarDays },
  { group: "STATION_CODE", label: "출발지 코드", icon: CarFront },
  { group: "RESERVATION_STATUS", label: "예약상태", icon: ClipboardList },
  { group: "PAYMENT_TYPE", label: "결제방식", icon: Database },
  { group: "PROGRESS_STATUS", label: "진행상태", icon: CircleGauge },
  { group: "BUS_TYPE", label: "차종", icon: Bus },
  { group: "HOTEL_STATUS", label: "숙박상태", icon: CalendarDays },
  { group: "RESTAURANT_STATUS", label: "식당상태", icon: Database },
  { group: "ROLE_CODE", label: "권한코드", icon: UsersRound },
  { group: "SMS_TEMPLATE", label: "문자템플릿", icon: ClipboardList },
] as const;
