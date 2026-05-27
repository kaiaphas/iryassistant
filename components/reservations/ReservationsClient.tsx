"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { Driver, Guide, Hotel, Restaurant, ScheduleGroup } from "@/lib/types";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationFilters, type ReservationFilterState } from "@/components/reservations/ReservationFilters";
import { ScheduleAccordionCards } from "@/components/reservations/ScheduleAccordionCards";
import { ScheduleAccordionTable } from "@/components/reservations/ScheduleAccordionTable";
import { getHotelAggregateStatus, getHotelProvisionalAggregateStatus, getRestaurantAggregateStatus, getScheduleHotelBookings, getScheduleProgressStatus } from "@/lib/reservation-status";
import { getKstDateInput } from "@/lib/date";
import { TablePagination } from "@/components/common/TablePagination";
import { useTableSort } from "@/lib/table-sort";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

function getDefaultDateRange() {
  return {
    startDate: getKstDateInput(),
    endDate: getKstDateInput(7),
  };
}

function getBusNoSortValue(busNo: string) {
  const match = busNo.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortSchedules(left: ScheduleGroup, right: ScheduleGroup) {
  const dateCompare = left.tourDate.localeCompare(right.tourDate);
  if (dateCompare !== 0) return dateCompare;

  const busNoCompare = getBusNoSortValue(left.busNo) - getBusNoSortValue(right.busNo);
  if (busNoCompare !== 0) return busNoCompare;

  return left.busNo.localeCompare(right.busNo, "ko", { numeric: true });
}

function formatBusSignText(value: string) {
  const text = value.trim();
  if (text.includes("\n")) return text;
  if (text.includes(" ")) return text.replaceAll(" ", "\n");
  if (text.length >= 5) {
    const mid = Math.ceil(text.length / 2);
    return `${text.slice(0, mid)}\n${text.slice(mid)}`;
  }
  return text;
}

const pageSize = 20;

export function ReservationsClient({
  scheduleGroups,
  guides,
  drivers,
  restaurants,
  hotels,
}: {
  scheduleGroups: ScheduleGroup[];
  guides: Guide[];
  drivers: Driver[];
  restaurants: Restaurant[];
  hotels: Hotel[];
}) {
  const defaultDateRange = React.useMemo(() => getDefaultDateRange(), []);
  const [schedules, setSchedules] = React.useState(scheduleGroups);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [saveMessage, setSaveMessage] = React.useState<string>("");
  const [dirtyScheduleIds, setDirtyScheduleIds] = React.useState<Set<string>>(() => new Set());
  const [printSchedule, setPrintSchedule] = React.useState<ScheduleGroup | null>(null);
  const [printTextByScheduleId, setPrintTextByScheduleId] = React.useState<Record<string, string>>({});
  const [printQueued, setPrintQueued] = React.useState(false);
  const [printMounted, setPrintMounted] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const printRootRef = React.useRef<HTMLDivElement | null>(null);
  const printTitleRef = React.useRef<HTMLDivElement | null>(null);
  const printTitleTextRef = React.useRef<HTMLSpanElement | null>(null);
  const [filters, setFilters] = React.useState<ReservationFilterState>({
    query: "",
    startDate: defaultDateRange.startDate,
    endDate: defaultDateRange.endDate,
    status: "",
    tourType: "",
    guide: "",
    restaurantStatus: "",
    hotelStatus: "",
  });
  const [openIds, setOpenIds] = React.useState<string[]>([scheduleGroups[2]?.id].filter(Boolean));
  const { setUnsavedChanges, clearUnsavedChanges } = useUnsavedChanges();

  React.useEffect(() => () => clearUnsavedChanges("reservations"), [clearUnsavedChanges]);
  React.useEffect(() => {
    setUnsavedChanges("reservations", dirtyScheduleIds.size > 0);
  }, [dirtyScheduleIds, setUnsavedChanges]);
  React.useEffect(() => {
    setPrintMounted(true);
  }, []);

  const filtered = schedules.filter((schedule) => {
    const q = filters.query.trim().toLowerCase();
    const dateMatch =
      (!filters.startDate || schedule.tourDate >= filters.startDate)
      && (!filters.endDate || schedule.tourDate <= filters.endDate);
    const queryMatch =
      !q ||
      [
        schedule.productName,
        schedule.productCode,
        schedule.guide.name,
        schedule.driver.name,
        ...schedule.restaurantBookings.flatMap((booking) => [booking.name, booking.mealType]),
        ...getScheduleHotelBookings(schedule).map((booking) => booking.name),
        schedule.vehicle.busInfo,
      ].some((value) => value?.toLowerCase().includes(q));
    const statusMatch = !filters.status || getScheduleProgressStatus(schedule) === filters.status;
    return dateMatch
      && queryMatch
      && statusMatch
      && (!filters.tourType || schedule.tourType === filters.tourType)
      && (!filters.guide || schedule.guide.name === filters.guide)
      && (!filters.restaurantStatus || getRestaurantAggregateStatus(schedule.restaurantBookings) === filters.restaurantStatus)
      && (!filters.hotelStatus || schedule.tourType === "당일" || getHotelAggregateStatus(getScheduleHotelBookings(schedule)) === filters.hotelStatus);
  }).sort(sortSchedules);
  const getSortValue = React.useCallback((schedule: ScheduleGroup, key: "tourDate" | "tourType" | "productName" | "busNo" | "departureTime" | "reservationCount" | "busCompany" | "busType" | "guide" | "driver" | "restaurant" | "hotel" | "restaurantStatus" | "provisionalStatus" | "hotelStatus" | "progressStatus") => ({
    tourDate: schedule.tourDate,
    tourType: schedule.tourType,
    productName: schedule.productName,
    busNo: getBusNoSortValue(schedule.busNo),
    departureTime: schedule.departureTime,
    reservationCount: schedule.reservationCount,
    busCompany: schedule.vehicle.busCompany,
    busType: schedule.vehicle.busType,
    guide: schedule.guide.name,
    driver: schedule.driver.name,
    restaurant: schedule.restaurantBookings.map((booking) => `${booking.mealType} ${booking.name}`).join(" / "),
    hotel: getScheduleHotelBookings(schedule).map((booking) => booking.name).join(" / "),
    restaurantStatus: getRestaurantAggregateStatus(schedule.restaurantBookings),
    provisionalStatus: getHotelProvisionalAggregateStatus(getScheduleHotelBookings(schedule)),
    hotelStatus: getHotelAggregateStatus(getScheduleHotelBookings(schedule)),
    progressStatus: getScheduleProgressStatus(schedule),
  }[key]), []);
  const { sortedItems, sortKey, sortDirection, sortApplied, toggleSort } = useTableSort<ScheduleGroup, "tourDate" | "tourType" | "productName" | "busNo" | "departureTime" | "reservationCount" | "busCompany" | "busType" | "guide" | "driver" | "restaurant" | "hotel" | "restaurantStatus" | "provisionalStatus" | "hotelStatus" | "progressStatus">(filtered, "tourDate", getSortValue);
  const filteredReservationCount = filtered.reduce((total, schedule) => total + schedule.reservationCount, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleSchedules = sortedItems.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  React.useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function toggleSchedule(id: string) {
    setOpenIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function updateSchedule(nextSchedule: ScheduleGroup) {
    setSchedules((current) => current.map((schedule) => schedule.id === nextSchedule.id ? nextSchedule : schedule));
    setDirtyScheduleIds((current) => new Set(current).add(nextSchedule.id));
  }

  async function saveSchedule(schedule: ScheduleGroup) {
    if (!schedule?.id) {
      setSaveMessage("저장할 일정 정보가 올바르지 않습니다.");
      return;
    }

    setSavingId(schedule.id);
    setSaveMessage("");

    try {
      const response = await fetch(`/api/reservations/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "저장에 실패했습니다.");
      }

      setSaveMessage(`${schedule.productName} 저장 완료`);
      setDirtyScheduleIds((current) => {
        const next = new Set(current);
        next.delete(schedule.id);
        return next;
      });
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  const fitPrintTitle = React.useCallback(() => {
    const title = printTitleRef.current;
    const titleText = printTitleTextRef.current;
    const printRoot = printRootRef.current;
    if (!title || !titleText || !printRoot) return;

    printRoot.style.display = "block";

    const containerWidth = title.clientWidth;
    const containerHeight = title.clientHeight;

    let minSize = 10;
    let maxSize = 500;
    let optimalSize = 10;

    while (minSize <= maxSize) {
      const mid = Math.floor((minSize + maxSize) / 2);
      titleText.style.fontSize = `${mid}px`;
      const rect = titleText.getBoundingClientRect();

      if (rect.width <= containerWidth && rect.height <= containerHeight) {
        optimalSize = mid;
        minSize = mid + 1;
      } else {
        maxSize = mid - 1;
      }
    }

    titleText.style.fontSize = `${Math.floor(optimalSize * 0.95)}px`;
    printRoot.style.display = "";
  }, []);

  React.useEffect(() => {
    if (!printQueued || !printSchedule) return;

    const frame = window.requestAnimationFrame(() => {
      fitPrintTitle();
      window.setTimeout(() => {
        window.print();
        setPrintQueued(false);
      }, 100);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fitPrintTitle, printQueued, printSchedule]);

  function printScheduleName(schedule: ScheduleGroup) {
    const printText = printTextByScheduleId[schedule.id]?.trim();
    setPrintSchedule(printText ? { ...schedule, productName: printText } : schedule);
    setPrintQueued(true);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-1">
        <Card>
          <CardContent className="flex items-center justify-between p-3">
            <div><p className="text-xs text-slate-500">전체 일정 / 인원</p><p className="mt-0.5 text-xl font-bold">{filtered.length}건 · {filteredReservationCount}명</p></div>
            <CalendarDays className="h-6 w-6 text-emerald-700" />
          </CardContent>
        </Card>
      </div>
        <ReservationFilters value={filters} onChange={setFilters} guides={guides} />
        {saveMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {saveMessage}
          </div>
        ) : null}
        <ScheduleAccordionTable
          schedules={visibleSchedules}
          openIds={openIds}
          onToggle={toggleSchedule}
          onChangeSchedule={updateSchedule}
          onSaveSchedule={saveSchedule}
          onPrintSchedule={printScheduleName}
          printTextByScheduleId={printTextByScheduleId}
          onChangePrintText={(scheduleId, value) => setPrintTextByScheduleId((current) => ({ ...current, [scheduleId]: value }))}
          savingId={savingId}
          guides={guides}
          drivers={drivers}
          restaurants={restaurants}
          hotels={hotels}
          sortKey={sortKey}
          sortDirection={sortDirection}
          sortApplied={sortApplied}
          onSort={toggleSort}
        />
        <ScheduleAccordionCards
          schedules={visibleSchedules}
          openIds={openIds}
          onToggle={toggleSchedule}
          onChangeSchedule={updateSchedule}
          onSaveSchedule={saveSchedule}
          onPrintSchedule={printScheduleName}
          printTextByScheduleId={printTextByScheduleId}
          onChangePrintText={(scheduleId, value) => setPrintTextByScheduleId((current) => ({ ...current, [scheduleId]: value }))}
          savingId={savingId}
          guides={guides}
          drivers={drivers}
          restaurants={restaurants}
          hotels={hotels}
        />
        <div className="overflow-hidden rounded-lg border bg-white">
          <TablePagination totalCount={filtered.length} page={page} onPageChange={setPage} unit="개" />
        </div>
        {printMounted && printSchedule ? createPortal(
          <div className="schedule-print-root" ref={printRootRef} aria-hidden="true">
            <div className="schedule-print-page">
              <div className="schedule-print-title" ref={printTitleRef}>
                <span className="schedule-print-title-text" ref={printTitleTextRef}>
                  {formatBusSignText(printSchedule.productName)}
                </span>
              </div>
              <div className="schedule-print-logo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="schedule-print-logo" src="/incheon-royal-tour-logo.jpg" alt="인천로열투어" />
              </div>
            </div>
          </div>,
          document.body,
        ) : null}
    </div>
  );
}
