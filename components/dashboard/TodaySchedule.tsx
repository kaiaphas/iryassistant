import type { Reservation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";

export function TodaySchedule({ items }: { items: Reservation[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 출발 일정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.orderId} className="rounded-lg border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{item.departureTime} · {item.productName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.busNo || "호차 미정"} · {item.busInfo || "차량 미배정"} · {item.station}
                </p>
              </div>
              <StatusBadge value={item.progressStatus} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <span>가이드 {item.guideName || "-"}</span>
              <span>기사 {item.driverName || "-"}</span>
              <span>총 {item.totalPeople}명</span>
              <span>{item.restaurantName || "식당 미정"}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
