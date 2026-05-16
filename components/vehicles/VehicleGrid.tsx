"use client";

import * as React from "react";
import { Bus } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { SearchInput } from "@/components/common/SearchInput";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { daysUntil } from "@/lib/format";
import { VehicleForm } from "@/components/vehicles/VehicleForm";

export function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Vehicle | undefined>();
  const [open, setOpen] = React.useState(false);
  const filtered = vehicles.filter((vehicle) => [vehicle.vehicleNo, vehicle.busType, vehicle.driverName].some((value) => value.toLowerCase().includes(query.toLowerCase())));

  function edit(vehicle?: Vehicle) {
    setSelected(vehicle);
    setOpen(true);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-lg border bg-white p-3 shadow-soft md:grid-cols-[1fr_auto]">
        <SearchInput placeholder="차량번호, 차종, 기사명 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button onClick={() => edit()}>+ 등록</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((vehicle) => {
          const insuranceWarning = daysUntil(vehicle.insuranceExpireDate) <= 30;
          const maintenanceDanger = daysUntil(vehicle.maintenanceDate) < 0;
          return (
            <Card key={vehicle.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Bus className="h-5 w-5" /></span>
                    <div>
                      <p className="font-semibold">{vehicle.vehicleNo}</p>
                      <p className="text-sm text-slate-500">{vehicle.busType} · {vehicle.seatCount}석</p>
                    </div>
                  </div>
                  <StatusBadge value={vehicle.operationStatus} />
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p>기사: {vehicle.driverName} / {vehicle.driverPhone}</p>
                  <p>보험만료일: {vehicle.insuranceExpireDate} {insuranceWarning ? <StatusBadge value="임박" /> : null}</p>
                  <p>정비예정일: {vehicle.maintenanceDate} {maintenanceDanger ? <StatusBadge value="경과" /> : null}</p>
                  <p>사용여부: {vehicle.active ? "사용" : "미사용"}</p>
                </div>
                <Button className="mt-3 w-full" variant="outline" onClick={() => edit(vehicle)}>수정</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <VehicleForm vehicle={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
