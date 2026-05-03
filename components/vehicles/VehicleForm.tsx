"use client";

import type { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

export function VehicleForm({ vehicle, open, onOpenChange }: { vehicle?: Vehicle; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="차량 등록 / 수정">
      <div className="space-y-3">
        <Input defaultValue={vehicle?.vehicleNo} placeholder="차량번호" />
        <Select defaultValue={vehicle?.busType || "우등버스"}>
          <option>우등버스</option>
          <option>대형버스</option>
          <option>25인승 버스</option>
          <option>승합</option>
        </Select>
        <Input defaultValue={vehicle?.seatCount} type="number" placeholder="좌석수" />
        <Input defaultValue={vehicle?.driverName} placeholder="기사명" />
        <Input defaultValue={vehicle?.driverPhone} placeholder="기사연락처" />
        <Input defaultValue={vehicle?.insuranceExpireDate} type="date" />
        <Input defaultValue={vehicle?.maintenanceDate} type="date" />
        <Select defaultValue={vehicle?.operationStatus || "운행가능"}>
          <option>운행가능</option>
          <option>배차중</option>
          <option>정비중</option>
          <option>운행중지</option>
        </Select>
        <Switch checked={vehicle?.active ?? true} label="사용여부" />
        <textarea className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" defaultValue={vehicle?.memo} placeholder="메모" />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={() => onOpenChange(false)}>저장</Button>
        </div>
      </div>
    </Sheet>
  );
}
