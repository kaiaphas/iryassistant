"use client";

import { SearchInput } from "@/components/common/SearchInput";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
}: {
  value: ReservationFilterState;
  onChange: (value: ReservationFilterState) => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-6">
        <label className="space-y-1 text-xs font-medium text-slate-600">
          여행일자
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              aria-label="여행일자 시작일"
              className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              type="date"
              value={value.startDate}
              onChange={(event) => onChange({ ...value, startDate: event.target.value })}
            />
            <input
              aria-label="여행일자 종료일"
              className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              type="date"
              value={value.endDate}
              onChange={(event) => onChange({ ...value, endDate: event.target.value })}
            />
          </div>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          상품명
          <Select>
            <option>전체</option>
            <option>남도비경 1박2일</option>
            <option>제주도 2박3일</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          진행상태
          <Select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
            <option value="">전체</option>
            <option>입금대기</option>
            <option>진행중</option>
            <option>출발완료</option>
            <option>준비중</option>
            <option>확인필요</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          구분
          <Select value={value.tourType} onChange={(event) => onChange({ ...value, tourType: event.target.value, hotelStatus: event.target.value === "당일" ? "" : value.hotelStatus })}>
            <option value="">전체</option>
            <option>당일</option>
            <option>숙박</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          가이드
          <Select value={value.guide} onChange={(event) => onChange({ ...value, guide: event.target.value })}>
            <option value="">전체</option>
            <option>김미정</option>
            <option>박영희</option>
            <option>이은선</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs font-medium text-slate-600">
          식당상태
          <Select value={value.restaurantStatus} onChange={(event) => onChange({ ...value, restaurantStatus: event.target.value })}>
            <option value="">전체</option>
            <option>예약전</option>
            <option>예약완료</option>
            <option>예약취소</option>
          </Select>
        </label>
        {value.tourType !== "당일" ? (
          <label className="space-y-1 text-xs font-medium text-slate-600">
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
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
      <SearchInput
        placeholder="상품명, 식당, 숙소, 가이드, 기사 검색"
        value={value.query}
        onChange={(event) => onChange({ ...value, query: event.target.value })}
      />
      <Button>검색</Button>
      <Button variant="outline" onClick={() => onChange({ query: "", startDate: "", endDate: "", status: "", tourType: "", guide: "", restaurantStatus: "", hotelStatus: "" })}>초기화</Button>
      <Button variant="outline">엑셀 다운로드</Button>
      </div>
    </div>
  );
}
