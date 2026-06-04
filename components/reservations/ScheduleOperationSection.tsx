"use client";

import { BusFront, UserRound } from "lucide-react";
import type { Driver, Guide, ScheduleGroup } from "@/lib/types";
import { Input } from "@/components/ui/input";

export function ScheduleOperationSection({
  schedule,
  guides,
  drivers,
  onChange,
}: {
  schedule: ScheduleGroup;
  guides: Guide[];
  drivers: Driver[];
  onChange: (schedule: ScheduleGroup) => void;
}) {
  function patch(next: Partial<ScheduleGroup>) {
    onChange({ ...schedule, ...next });
  }

  function patchVehicle(next: Partial<ScheduleGroup["vehicle"]>) {
    patch({ vehicle: { ...schedule.vehicle, ...next } });
  }

  function patchGuide(name: string) {
    const guide = guides.find((item) => item.name === name);
    patch({ guide: { id: guide?.id, name, phone: guide?.phone } });
  }

  function patchGuidePhone(phone: string) {
    patch({ guide: { ...schedule.guide, phone } });
  }

  function patchDriver(name: string) {
    const driver = drivers.find((item) => item.name === name);
    patch({ driver: { id: driver?.id, name, phone: driver?.phone } });
  }

  function patchDriverPhone(phone: string) {
    patch({ driver: { ...schedule.driver, phone } });
  }

  return (
    <section className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-900">
        <BusFront className="h-4 w-4" />
        운영 배정 정보
      </div>
      <div className="grid gap-2 xl:grid-cols-6">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          가이드
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 pl-9 text-xs"
              list="reservation-guide-options"
              value={schedule.guide.name === "-" ? "" : schedule.guide.name}
              onChange={(event) => patchGuide(event.target.value)}
              placeholder="가이드명 직접 입력"
            />
          </div>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          가이드 연락처
          <Input
            className="h-9 text-xs"
            value={schedule.guide.phone || ""}
            onChange={(event) => patchGuidePhone(event.target.value)}
            placeholder="가이드 연락처"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          기사
          <Input
            className="h-9 text-xs"
            list="reservation-driver-options"
            value={schedule.driver.name === "-" ? "" : schedule.driver.name}
            onChange={(event) => patchDriver(event.target.value)}
            placeholder="기사명 직접 입력"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          기사 연락처
          <Input
            className="h-9 text-xs"
            value={schedule.driver.phone || ""}
            onChange={(event) => patchDriverPhone(event.target.value)}
            placeholder="기사 연락처"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          버스회사
          <Input
            className="h-9 text-xs"
            value={schedule.vehicle.busCompany || ""}
            onChange={(event) => patchVehicle({ busCompany: event.target.value })}
            placeholder="버스회사"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          인승
          <Input
            className="h-9 text-xs"
            value={schedule.vehicle.busType || ""}
            onChange={(event) => patchVehicle({ busType: event.target.value, seatCount: Number.parseInt(event.target.value, 10) || 0 })}
            placeholder="예: 28인승"
          />
        </label>
      </div>
      <datalist id="reservation-guide-options">
        {guides.filter((guide) => guide.active).map((guide) => (
          <option key={guide.id} value={guide.name}>{guide.phone}</option>
        ))}
      </datalist>
      <datalist id="reservation-driver-options">
        {drivers.filter((driver) => driver.active).map((driver) => (
          <option key={driver.id} value={driver.name}>{driver.phone}</option>
        ))}
      </datalist>
    </section>
  );
}
