import type { ScheduleGroup } from "@/lib/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TodayDepartureTable({ schedules }: { schedules: ScheduleGroup[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 출발 일정</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[780px]">
            <TableHeader>
              <TableRow>
                {["출발시간", "상품명", "호차", "차량", "가이드", "기사", "출발장소", "진행상태"].map((head) => (
                  <TableHead key={head}>{head}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-semibold">{schedule.departureTime}</TableCell>
                  <TableCell>{schedule.productName}</TableCell>
                  <TableCell>{schedule.busNo}</TableCell>
                  <TableCell>{schedule.vehicle.busInfo}</TableCell>
                  <TableCell>{schedule.guide.name}</TableCell>
                  <TableCell>{schedule.driver.name}</TableCell>
                  <TableCell>인천종합터미널</TableCell>
                  <TableCell><StatusBadge value={schedule.progressStatus === "대기" ? "대기중" : "진행중"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
