"use client";

import type { Restaurant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function RestaurantForm({ restaurant }: { restaurant?: Restaurant }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-soft">
      <h3 className="mb-4 font-semibold">식당 등록/수정</h3>
      <div className="space-y-3">
        <Input defaultValue={restaurant?.productName} placeholder="상품명" />
        <Input defaultValue={restaurant?.regionName} placeholder="지역명" />
        <Input defaultValue={restaurant?.shopName} placeholder="상호명" />
        <Input defaultValue={restaurant?.menu} placeholder="메뉴" />
        <div className="grid grid-cols-2 gap-2"><Input defaultValue={restaurant?.retailPrice} type="number" placeholder="소비자가" /><Input defaultValue={restaurant?.depositPrice} type="number" placeholder="입금가" /></div>
        <Select defaultValue={restaurant?.serviceType || "없음"}><option>기사</option><option>가이드</option><option>기사+가이드</option><option>없음</option></Select>
        <Input defaultValue={restaurant?.phone} placeholder="연락처" />
        <Input defaultValue={restaurant?.address} placeholder="주소" />
        <textarea className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" defaultValue={restaurant?.note} placeholder="특이사항" />
        <div className="flex justify-end gap-2"><Button variant="outline">취소</Button><Button>저장</Button></div>
      </div>
    </div>
  );
}
