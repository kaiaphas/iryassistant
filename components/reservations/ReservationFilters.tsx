"use client";

import { SearchInput } from "@/components/common/SearchInput";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Guide } from "@/lib/types";

export type ReservationFilterState = {
  query: string;
  startDate: string;
  endDate: string;
  status: string;
  tourType: string;
  guide: string;
  restaurantStatus: string;
  hotelStatus: string;
};

export function ReservationFilters({
  value,
  onChange,
  guides,
}: {
  value: ReservationFilterState;
  onChange: (value: ReservationFilterState) => void;
  guides: Guide[];
}) {
  const guideOptions = guides
    .filter((guide) => guide.active)
    .map((guide) => guide.name)
    .filter((name, index, names) => name && names.indexOf(name) === index)
    .sort((left, right) => left.localeCompare(right, "ko"));

  return (
    <div className="rounded-lg border bg-white p-3 shadow-soft">
      <div className="grid gap-2 xl:grid-cols-12">
        <label className="space-y-1 text-xs font-medium text-slate-600 xl:col-span-3">
          여행일자
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              aria-label="여행일자 시작일"
              className="h-9 min-w-[150px] rounded-md border bg-white px-3 text-sm font-semibold tracking-wide text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              type="date"
              value={value.startDate}
              onChange={(event) => onChange({ ...value, startDate: event.target.value })}
            />
            <input
              aria-label="여행일자 종료일"
              className="h-9 min-w-[150px] rounded-md border bg-white px-3 text-sm font-semibold tracking-wide text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              type="date"
              value={value.endDate}
              onChange={(event) => onChange({ ...value, endDate: event.target.value })}
            />
          </div>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600 xl:col-span-2">
          진행상태
          <Select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
            <option value="">전체</option>
            <option>진행중</option>
            <option>예약완료</option>
            <option>취소완료</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600 xl:col-span-1">
          구분
          <Select value={value.tourType} onChange={(event) => onChange({ ...value, tourType: event.target.value, hotelStatus: event.target.value === "당일" ? "" : value.hotelStatus })}>
            <option value="">전체</option>
            <option>당일</option>
            <option>숙박</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600 xl:col-span-2">
          가이드
          <Select value={value.guide} onChange={(event) => onChange({ ...value, guide: event.target.value })}>
            <option value="">전체</option>
            {guideOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600 xl:col-span-2">
          식당상태
          <Select value={value.restaurantStatus} onChange={(event) => onChange({ ...value, restaurantStatus: event.target.value })}>
            <option value="">전체</option>
            <option>예약전</option>
            <option>예약완료</option>
            <option>예약취소</option>
          </Select>
        </label>
        {value.tourType !== "당일" ? (
          <label className="space-y-1 text-xs font-medium text-slate-600 xl:col-span-2">
            숙소상태
            <Select value={value.hotelStatus} onChange={(event) => onChange({ ...value, hotelStatus: event.target.value })}>
              <option value="">전체</option>
              <option>예약전</option>
              <option>예약완료</option>
              <option>예약취소</option>
            </Select>
          </label>
        ) : null}
      </div>
      <div className="mt-2 grid items-end gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <SearchInput
          placeholder="상품명, 식당, 숙소, 가이드, 기사 검색"
          value={value.query}
          onChange={(event) => onChange({ ...value, query: event.target.value })}
        />
        <Button className="min-w-20">검색</Button>
        <Button className="min-w-20" variant="outline" onClick={() => onChange({ query: "", startDate: "", endDate: "", status: "", tourType: "", guide: "", restaurantStatus: "", hotelStatus: "" })}>초기화</Button>
        <Button className="min-w-28" variant="outline">엑셀 다운로드</Button>
      </div>
    </div>
  );
}
