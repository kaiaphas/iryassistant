"use client";

import * as React from "react";
import type { Restaurant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";

type RestaurantFormProps = {
  restaurant?: Restaurant;
  open: boolean;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (restaurant: Restaurant) => Promise<void>;
  onCancel: () => void;
};

function createEmptyRestaurant(): Restaurant {
  return {
    id: "",
    tourType: "숙박",
    productName: "",
    regionName: "",
    shopName: "",
    menu: "",
    retailPrice: 0,
    depositPrice: 0,
    serviceType: "없음",
    phone: "",
    address: "",
    note: "",
  };
}

export function RestaurantForm({ restaurant, open, saving = false, onOpenChange, onSave, onCancel }: RestaurantFormProps) {
  const [form, setForm] = React.useState<Restaurant>(restaurant ?? createEmptyRestaurant());

  React.useEffect(() => {
    if (open) setForm(restaurant ?? createEmptyRestaurant());
  }, [restaurant, open]);

  function update<K extends keyof Restaurant>(key: K, value: Restaurant[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={form.id ? "식당 수정" : "식당 등록"}>
      <div className="space-y-3">
        <Input value={form.regionName} onChange={(event) => update("regionName", event.target.value)} placeholder="지역명" />
        <Select value={form.tourType} onChange={(event) => update("tourType", event.target.value as Restaurant["tourType"])}>
          <option>당일</option>
          <option>숙박</option>
        </Select>
        <Input value={form.productName} onChange={(event) => update("productName", event.target.value)} placeholder="상품명" />
        <Input value={form.shopName} onChange={(event) => update("shopName", event.target.value)} placeholder="상호명" />
        <Input value={form.menu} onChange={(event) => update("menu", event.target.value)} placeholder="메뉴" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={form.retailPrice} onChange={(event) => update("retailPrice", Number(event.target.value) || 0)} type="number" placeholder="소비자가" />
          <Input value={form.depositPrice} onChange={(event) => update("depositPrice", Number(event.target.value) || 0)} type="number" placeholder="입금가" />
        </div>
        <Select value={form.serviceType} onChange={(event) => update("serviceType", event.target.value as Restaurant["serviceType"])}>
          <option>기사</option><option>가이드</option><option>기사+가이드</option><option>없음</option>
        </Select>
        <Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="연락처" />
        <Input value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="주소" />
        <textarea
          className="min-h-28 w-full rounded-md border bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          value={form.note ?? ""}
          onChange={(event) => update("note", event.target.value)}
          placeholder="특이사항"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>취소</Button>
          <Button onClick={() => onSave(form)} disabled={saving}>{saving ? "저장 중" : "저장"}</Button>
        </div>
      </div>
    </Sheet>
  );
}
