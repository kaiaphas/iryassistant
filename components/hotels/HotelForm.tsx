"use client";

import type { Hotel, RoomRate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const roomRows: Array<[keyof Hotel["roomRates"], string]> = [["double", "2인실"], ["triple", "3인실"], ["quad", "4인실"]];
const fields: Array<[keyof RoomRate, string]> = [["weekday", "단가/주중"], ["friday", "금"], ["saturday", "토"], ["peak", "성수기"], ["breakfast", "조식"]];

export function HotelForm({ hotel }: { hotel?: Hotel }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-soft">
      <h3 className="mb-4 font-semibold">호텔 등록/수정</h3>
      <div className="space-y-3">
        <Input defaultValue={hotel?.regionName} placeholder="지역명" />
        <Input defaultValue={hotel?.shopName} placeholder="상호명" />
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50">
              <tr><th className="p-2 text-left">타입</th>{fields.map(([, label]) => <th key={label} className="p-2 text-left">{label}</th>)}</tr>
            </thead>
            <tbody>
              {roomRows.map(([key, label]) => (
                <tr key={key} className="border-t">
                  <td className="p-2 font-semibold">{label}</td>
                  {fields.map(([field]) => <td key={field} className="p-2"><Input type="number" defaultValue={hotel?.roomRates[key][field] ?? 0} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <textarea className="min-h-24 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" defaultValue={hotel?.note} placeholder="특이사항" />
        <Input defaultValue={hotel?.phone} placeholder="연락처" />
        <Input defaultValue={hotel?.address} placeholder="주소" />
        <div className="grid grid-cols-2 gap-2">
          <Select defaultValue={hotel?.driverBenefit || "미제공"}><option>제공</option><option>부분할인</option><option>미제공</option></Select>
          <Select defaultValue={hotel?.guideBenefit || "미제공"}><option>제공</option><option>부분할인</option><option>미제공</option></Select>
        </div>
        <div className="flex justify-end gap-2"><Button variant="outline">취소</Button><Button>저장</Button></div>
      </div>
    </div>
  );
}
