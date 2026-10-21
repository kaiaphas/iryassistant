import assert from "node:assert/strict";
import { test } from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ReservationCustomerPrint } from "../components/reservations/ReservationCustomerPrint";
import type { ScheduleGroup } from "../lib/types";

function makeSchedule(adult = 8, child = 3): ScheduleGroup {
  return {
    id: "print-layout-test", tourType: "당일", tourDate: "2026-10-21", dayLabel: "수",
    productCode: "test", productName: "인쇄 테스트", reservationCount: adult + child, notBusCount: 0,
    departureTime: "06:20", returnTime: "06:40", busNo: "1",
    vehicle: { busInfo: "", busType: "", seatCount: 45 },
    driver: { name: "테스트 기사", phone: "010-0000-0001" },
    guide: { name: "테스트 가이드", phone: "010-0000-0002" },
    restaurant: { name: "" }, restaurantBookings: [],
    hotelBooking: {
      name: "", provisionalRooms: { double: 0, triple: 0, quadruple: 0 },
      rooms: { double: 0, triple: 0, quadruple: 0 }, provisionalStatus: "예약전", status: "예약전",
    },
    progressStatus: "",
    reservations: [{
      orderId: "print-customer-test", customerName: "테스트 예약자", phone: "",
      tourDate: "2026-10-21", station: "", reservationStatus: "", totalPeople: adult + child,
      adult, child, price: 0, paymentType: "", reservationDate: "", staffName: "", productName: "인쇄 테스트",
    }],
  };
}

function render(schedule: ScheduleGroup) {
  return renderToStaticMarkup(React.createElement(ReservationCustomerPrint, { schedule }));
}

test("driver and guide phone numbers appear directly beneath their own names", () => {
  const html = render(makeSchedule());
  assert.match(html, /<span>기사: 테스트 기사<\/span><span>010-0000-0001<\/span>/);
  assert.match(html, /<span>가이드: 테스트 가이드<\/span><span>010-0000-0002<\/span>/);
});

test("missing or placeholder phone numbers do not add empty contact lines", () => {
  const schedule = makeSchedule();
  schedule.driver.phone = undefined;
  schedule.guide.phone = " - ";
  const html = render(schedule);
  assert.match(html, /<span>기사: 테스트 기사<\/span><span>가이드: 테스트 가이드<\/span><span>견습:/);
  assert.doesNotMatch(html, /undefined|null|010-0000/);
});

test("mixed boarding counts use separate lines instead of an overflowing slash-separated label", () => {
  const html = render(makeSchedule());
  assert.match(html, /class="passenger-print-boarding">주안:8\n메가:3<\/td>/);
  assert.doesNotMatch(html, /주안:8 \/ 메가:3/);
});

test("single boarding groups and empty reservations retain their existing placeholders", () => {
  assert.match(render(makeSchedule(8, 0)), /class="passenger-print-boarding">주안:8<\/td>/);
  assert.match(render(makeSchedule(0, 3)), /class="passenger-print-boarding">메가:3<\/td>/);
  assert.match(render(makeSchedule(0, 0)), /class="passenger-print-boarding">-<\/td>/);
  const schedule = makeSchedule();
  schedule.reservations = [];
  assert.match(render(schedule), /class="passenger-print-boarding">-<\/td>/);
});
