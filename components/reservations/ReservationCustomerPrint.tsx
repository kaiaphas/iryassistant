import type { ScheduleGroup } from "@/lib/types";

function formatPrice(value?: number) {
  return value ? new Intl.NumberFormat("ko-KR").format(value) : "-";
}

function formatPrintDate(value: string, dayLabel: string) {
  const [year, month, day] = value.split("-");
  return `${year?.slice(-2)}년${month}월${day}일 (${dayLabel})`;
}

function printPeopleLabel(adult: number, child: number) {
  return [adult > 0 ? `주안:${adult}` : "", child > 0 ? `메가:${child}` : ""].filter(Boolean).join(" / ") || "-";
}

function incentiveLabel(value?: string) {
  const label = value?.trim();
  return !label || label === "-" ? "신청예정" : label;
}

export function ReservationCustomerPrint({ schedule }: { schedule: ScheduleGroup }) {
  const apprenticeNames = schedule.eduGuideNames?.join(", ") || "-";
  const hotelNames = schedule.hotelBookings?.map((hotel) => hotel.name).filter(Boolean).join(", ")
    || schedule.hotel?.name
    || "-";
  const reservations = schedule.reservations.length > 0 ? schedule.reservations : [null];

  return (
    <div className="passenger-print-page">
      <table className="passenger-print-summary">
        <colgroup>
          <col className="passenger-print-col-status" />
          <col className="passenger-print-col-dispatch" />
          <col className="passenger-print-col-price" />
          <col className="passenger-print-col-people" />
          <col className="passenger-print-col-name" />
          <col className="passenger-print-col-boarding" />
          <col className="passenger-print-col-phone" />
          <col className="passenger-print-col-payment" />
          <col className="passenger-print-col-note" />
        </colgroup>
        <tbody>
          <tr>
            <th colSpan={9} className="passenger-print-heading">
              <span>{formatPrintDate(schedule.tourDate, schedule.dayLabel)}</span>
              {schedule.productName}
            </th>
          </tr>
          <tr className="passenger-print-group-head">
            <th>호차/상태</th>
            <th>수배현황</th>
            <th>가격</th>
            <th>인원</th>
            <th colSpan={4}>예약자</th>
            <th>비고</th>
          </tr>
          {reservations.map((reservation, index) => (
            <tr key={reservation?.orderId ?? "empty"} className="passenger-print-reservation-row">
              {index === 0 ? (
                <>
                  <td className="passenger-print-status" rowSpan={reservations.length}>
                    <strong>{schedule.busNo || "-"}호차</strong>
                    <b>출발시간</b>
                    <span>{schedule.departureTime || "-"}</span>
                    <span>{schedule.returnTime || "-"}</span>
                  </td>
                  <td className="passenger-print-dispatch" rowSpan={reservations.length}>
                    <span>차량: {[schedule.vehicle.busCompany, schedule.vehicle.busType].filter(Boolean).join(" ") || "-"}</span>
                    <span>기사: {schedule.driver.name || "-"}</span>
                    <span>가이드: {schedule.guide.name || "-"}</span>
                    <span>견습: {apprenticeNames}</span>
                    <span>호텔: {hotelNames}</span>
                    <span>인센: {incentiveLabel(schedule.incentiveStatus)}</span>
                  </td>
                  <td className="passenger-print-number" rowSpan={reservations.length}>{formatPrice(schedule.price)}</td>
                  <td className="passenger-print-number" rowSpan={reservations.length}>{schedule.reservationCount}</td>
                </>
              ) : null}
              <td className="passenger-print-name">
                {reservation ? <strong>{reservation.customerName}</strong> : "-"}
              </td>
              <td className="passenger-print-boarding">
                {reservation ? printPeopleLabel(reservation.adult, reservation.child) : "-"}
              </td>
              <td className="passenger-print-phone">{reservation?.phone || "-"}</td>
              <td className="passenger-print-payment">{reservation?.paymentDate ? `입금일 : ${reservation.paymentDate}` : ""}</td>
              <td className="passenger-print-note">{reservation?.internalMemo || ""}</td>
            </tr>
          ))}
          <tr className="passenger-print-blank-row">
            <td colSpan={9}>{schedule.dispatchMemo || ""}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
