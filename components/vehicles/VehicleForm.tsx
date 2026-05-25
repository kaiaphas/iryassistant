"use client";

"use client";

import * as React from "react";
import type { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

export function VehicleForm({ vehicle, open, onOpenChange }: { vehicle?: Vehicle; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [dirty, setDirty] = React.useState(false);
  const { setUnsavedChanges, clearUnsavedChanges, confirmNavigation } = useUnsavedChanges();

  React.useEffect(() => {
    if (open) setDirty(false);
  }, [open, vehicle]);

  React.useEffect(() => {
    setUnsavedChanges("vehicle-form", open && dirty);
  }, [dirty, open, setUnsavedChanges]);

  React.useEffect(() => () => clearUnsavedChanges("vehicle-form"), [clearUnsavedChanges]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && dirty && !confirmNavigation()) return;
    if (!nextOpen) clearUnsavedChanges("vehicle-form");
    onOpenChange(nextOpen);
  }

  function save() {
    clearUnsavedChanges("vehicle-form");
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} title="차량 등록 / 수정">
      <div className="space-y-3" onChangeCapture={() => setDirty(true)}>
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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>취소</Button>
          <Button onClick={save}>저장</Button>
        </div>
      </div>
    </Sheet>
  );
}
