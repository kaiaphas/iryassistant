"use client";

import * as React from "react";
import type { Hotel, RoomRate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";

const roomRows: Array<[keyof Hotel["roomRates"], string]> = [["double", "2인실"], ["triple", "3인실"], ["quad", "4인실"]];
const fields: Array<[keyof RoomRate, string]> = [["weekday", "단가/주중"], ["friday", "금"], ["saturday", "토"], ["peak", "성수기"], ["breakfast", "조식"]];

type HotelFormProps = {
  hotel?: Hotel;
  open: boolean;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (hotel: Hotel) => Promise<void>;
  onCancel: () => void;
};

const emptyRate: RoomRate = { weekday: 0, friday: 0, saturday: 0, peak: 0, breakfast: 0 };

function createEmptyHotel(): Hotel {
  return {
    id: "",
    regionName: "",
    shopName: "",
    roomRates: {
      double: { ...emptyRate },
      triple: { ...emptyRate },
      quad: { ...emptyRate },
    },
    phone: "",
    address: "",
    note: "",
    driverBenefit: "미제공",
    guideBenefit: "미제공",
  };
}

export function HotelForm({ hotel, open, saving = false, onOpenChange, onSave, onCancel }: HotelFormProps) {
  const [form, setForm] = React.useState<Hotel>(hotel ?? createEmptyHotel());

  React.useEffect(() => {
    if (open) setForm(hotel ?? createEmptyHotel());
  }, [hotel, open]);

  function update<K extends keyof Hotel>(key: K, value: Hotel[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateRate(roomKey: keyof Hotel["roomRates"], field: keyof RoomRate, value: number) {
    setForm((current) => ({
      ...current,
      roomRates: {
        ...current.roomRates,
        [roomKey]: {
          ...current.roomRates[roomKey],
          [field]: value,
        },
      },
    }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={form.id ? "호텔 수정" : "호텔 등록"} className="w-[min(96vw,760px)]">
      <div className="space-y-3">
        <Input value={form.regionName} onChange={(event) => update("regionName", event.target.value)} placeholder="지역명" />
        <Input value={form.shopName} onChange={(event) => update("shopName", event.target.value)} placeholder="상호명" />
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50">
              <tr><th className="p-2 text-left">타입</th>{fields.map(([, label]) => <th key={label} className="p-2 text-left">{label}</th>)}</tr>
            </thead>
            <tbody>
              {roomRows.map(([key, label]) => (
                <tr key={key} className="border-t">
                  <td className="p-2 font-semibold">{label}</td>
                  {fields.map(([field]) => (
                    <td key={field} className="p-2">
                      <Input type="number" value={form.roomRates[key][field]} onChange={(event) => updateRate(key, field, Number(event.target.value) || 0)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <textarea
          className="min-h-24 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          value={form.note ?? ""}
          onChange={(event) => update("note", event.target.value)}
          placeholder="특이사항"
        />
        <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="연락처" />
        <Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="주소" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.driverBenefit} onChange={(event) => update("driverBenefit", event.target.value as Hotel["driverBenefit"])}><option>제공</option><option>부분할인</option><option>미제공</option></Select>
          <Select value={form.guideBenefit} onChange={(event) => update("guideBenefit", event.target.value as Hotel["guideBenefit"])}><option>제공</option><option>부분할인</option><option>미제공</option></Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>취소</Button>
          <Button onClick={() => onSave(form)} disabled={saving}>{saving ? "저장 중" : "저장"}</Button>
        </div>
      </div>
    </Sheet>
  );
}
