import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";
import type { FacilityBookingStatus, RestaurantBooking, ScheduleGroup } from "@/lib/types";
import { getScheduleProgressStatus } from "@/lib/reservation-status";

type RouteContext = {
  params: Promise<{
    scheduleId: string;
  }>;
};

function toRestaurantStatus(status: FacilityBookingStatus) {
  if (status === "예약완료") return "COMPLETED";
  if (status === "예약취소") return "CANCELED";
  return "BEFORE";
}

function toMealType(mealType: RestaurantBooking["mealType"]) {
  if (mealType === "조식") return "BREAKFAST";
  return mealType === "석식" ? "DINNER" : "LUNCH";
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { scheduleId } = await context.params;
  const schedule = (await request.json()) as ScheduleGroup;
  const supabase = createSupabaseServerClient();

  if (!scheduleId || scheduleId !== schedule.id) {
    return NextResponse.json({ message: "일정 ID가 올바르지 않습니다." }, { status: 400 });
  }
  const progressStatus = getScheduleProgressStatus(schedule);

  let { error: scheduleError } = await supabase
    .from("reservation_schedules")
    .upsert({
      id: scheduleId,
      source_schedule_key: cleanText(schedule.sourceScheduleKey),
      tour_date: schedule.tourDate,
      tour_type: schedule.tourType === "숙박" ? "STAY" : "DAY",
      product_code: cleanText(schedule.productCode),
      product_name: cleanText(schedule.productName) ?? "상품명 미정",
      departure_time: cleanText(schedule.departureTime),
      return_time: cleanText(schedule.returnTime),
      guide_name: cleanText(schedule.guide.name),
      guide_phone: cleanText(schedule.guide.phone),
      driver_name: cleanText(schedule.driver.name),
      driver_phone: cleanText(schedule.driver.phone),
      vehicle_no: cleanText(schedule.vehicle.busInfo),
      bus_company: cleanText(schedule.vehicle.busCompany),
      vehicle_capacity: cleanText(schedule.vehicle.busType),
      progress_status: progressStatus === "취소완료" ? "CANCELED" : progressStatus === "예약완료" ? "COMPLETED" : "IN_PROGRESS",
      memo: cleanText(schedule.dispatchMemo),
      is_active: true,
    });

  if (scheduleError?.message.includes("guide_phone") || scheduleError?.message.includes("driver_phone")) {
    return NextResponse.json(
      { message: "가이드/기사 연락처 저장 컬럼이 없습니다. supabase/20260505_add_schedule_contact_columns.sql을 먼저 실행해주세요." },
      { status: 500 },
    );
  }

  if (scheduleError?.message.includes("bus_company")) {
    const fallback = await supabase
      .from("reservation_schedules")
      .upsert({
        id: scheduleId,
        source_schedule_key: cleanText(schedule.sourceScheduleKey),
        tour_date: schedule.tourDate,
        tour_type: schedule.tourType === "숙박" ? "STAY" : "DAY",
        product_code: cleanText(schedule.productCode),
        product_name: cleanText(schedule.productName) ?? "상품명 미정",
        departure_time: cleanText(schedule.departureTime),
        return_time: cleanText(schedule.returnTime),
        guide_name: cleanText(schedule.guide.name),
        guide_phone: cleanText(schedule.guide.phone),
        driver_name: cleanText(schedule.driver.name),
        driver_phone: cleanText(schedule.driver.phone),
        vehicle_no: cleanText(schedule.vehicle.busInfo),
        vehicle_capacity: cleanText(schedule.vehicle.busType),
        progress_status: progressStatus === "취소완료" ? "CANCELED" : progressStatus === "예약완료" ? "COMPLETED" : "IN_PROGRESS",
        memo: cleanText(schedule.dispatchMemo),
        is_active: true,
      });
    scheduleError = fallback.error;
  }

  if (scheduleError) {
    return NextResponse.json({ message: `일정 메모 저장 실패: ${scheduleError.message}` }, { status: 500 });
  }

  const { error: deleteRestaurantError } = await supabase
    .from("schedule_restaurant_bookings")
    .delete()
    .eq("schedule_id", scheduleId);

  if (deleteRestaurantError) {
    return NextResponse.json({ message: `기존 식당 예약현황 삭제 실패: ${deleteRestaurantError.message}` }, { status: 500 });
  }

  const restaurantRows = schedule.restaurantBookings
    .filter((booking) => cleanText(booking.name))
    .map((booking, index) => ({
      id: randomUUID(),
      schedule_id: scheduleId,
      meal_type: toMealType(booking.mealType),
      restaurant_name: cleanText(booking.name),
      restaurant_phone: cleanText(booking.phone),
      restaurant_memo: cleanText(booking.memo),
      booking_status: toRestaurantStatus(booking.status),
      sort_order: index + 1,
    }));

  if (restaurantRows.length > 0) {
    const { error: insertRestaurantError } = await supabase
      .from("schedule_restaurant_bookings")
      .insert(restaurantRows);

    if (insertRestaurantError) {
      return NextResponse.json({ message: `식당 예약현황 저장 실패: ${insertRestaurantError.message}` }, { status: 500 });
    }
  }

  if (schedule.tourType !== "숙박") {
    const { error: deleteHotelError } = await supabase
      .from("schedule_hotel_bookings")
      .delete()
      .eq("schedule_id", scheduleId);

    if (deleteHotelError) {
      return NextResponse.json({ message: `당일 일정 숙소 정보 삭제 실패: ${deleteHotelError.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const hotel = schedule.hotelBooking;
  const hasHotelData =
    Boolean(cleanText(hotel.name))
    || Boolean(cleanText(hotel.phone))
    || hotel.provisionalStatus !== "예약전"
    || hotel.status !== "예약전"
    || hotel.provisionalRooms.double > 0
    || hotel.provisionalRooms.triple > 0
    || hotel.provisionalRooms.quadruple > 0
    || hotel.rooms.double > 0
    || hotel.rooms.triple > 0
    || hotel.rooms.quadruple > 0;

  if (!hasHotelData) {
    const { error: deleteHotelError } = await supabase
      .from("schedule_hotel_bookings")
      .delete()
      .eq("schedule_id", scheduleId);

    if (deleteHotelError) {
      return NextResponse.json({ message: `숙소 예약현황 삭제 실패: ${deleteHotelError.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const { data: existingHotel, error: existingHotelError } = await supabase
    .from("schedule_hotel_bookings")
    .select("id")
    .eq("schedule_id", scheduleId)
    .maybeSingle();

  if (existingHotelError) {
    return NextResponse.json({ message: `숙소 예약현황 조회 실패: ${existingHotelError.message}` }, { status: 500 });
  }

  let hotelBookingId = existingHotel?.id as string | undefined;
  const hotelPayload = {
    schedule_id: scheduleId,
    hotel_name: cleanText(hotel.name) ?? "",
    hotel_phone: cleanText(hotel.phone),
    provisional_booking_status: toRestaurantStatus(hotel.provisionalStatus),
    provisional_double_room_count: Math.max(0, Number(hotel.provisionalRooms.double) || 0),
    provisional_triple_room_count: Math.max(0, Number(hotel.provisionalRooms.triple) || 0),
    provisional_quad_room_count: Math.max(0, Number(hotel.provisionalRooms.quadruple) || 0),
    booking_status: toRestaurantStatus(hotel.status),
  };

  if (hotelBookingId) {
    let { error: updateHotelError } = await supabase
      .from("schedule_hotel_bookings")
      .update(hotelPayload)
      .eq("id", hotelBookingId);

    if (updateHotelError?.message.includes("provisional_")) {
      const fallbackPayload = { ...hotelPayload } as Partial<typeof hotelPayload>;
      delete fallbackPayload.provisional_booking_status;
      delete fallbackPayload.provisional_double_room_count;
      delete fallbackPayload.provisional_triple_room_count;
      delete fallbackPayload.provisional_quad_room_count;
      const fallback = await supabase
        .from("schedule_hotel_bookings")
        .update(fallbackPayload)
        .eq("id", hotelBookingId);
      updateHotelError = fallback.error;
    }

    if (updateHotelError) {
      return NextResponse.json({ message: `숙소 예약현황 저장 실패: ${updateHotelError.message}` }, { status: 500 });
    }
  } else {
    let { data: insertedHotel, error: insertHotelError } = await supabase
      .from("schedule_hotel_bookings")
      .insert(hotelPayload)
      .select("id")
      .single();

    if (insertHotelError?.message.includes("provisional_")) {
      const fallbackPayload = { ...hotelPayload } as Partial<typeof hotelPayload>;
      delete fallbackPayload.provisional_booking_status;
      delete fallbackPayload.provisional_double_room_count;
      delete fallbackPayload.provisional_triple_room_count;
      delete fallbackPayload.provisional_quad_room_count;
      const fallback = await supabase
        .from("schedule_hotel_bookings")
        .insert(fallbackPayload)
        .select("id")
        .single();
      insertedHotel = fallback.data;
      insertHotelError = fallback.error;
    }

    if (insertHotelError || !insertedHotel) {
      return NextResponse.json({ message: `숙소 예약현황 저장 실패: ${insertHotelError?.message ?? "저장 결과가 없습니다."}` }, { status: 500 });
    }

    hotelBookingId = insertedHotel.id as string;
  }

  const { error: deleteRoomsError } = await supabase
    .from("schedule_hotel_room_assignments")
    .delete()
    .eq("hotel_booking_id", hotelBookingId);

  if (deleteRoomsError) {
    return NextResponse.json({ message: `기존 객실배정 삭제 실패: ${deleteRoomsError.message}` }, { status: 500 });
  }

  const roomRows = [
    { hotel_booking_id: hotelBookingId, room_type: "DOUBLE", room_count: hotel.rooms.double },
    { hotel_booking_id: hotelBookingId, room_type: "TRIPLE", room_count: hotel.rooms.triple },
    { hotel_booking_id: hotelBookingId, room_type: "QUAD", room_count: hotel.rooms.quadruple },
  ].filter((room) => room.room_count > 0);

  if (roomRows.length > 0) {
    const { error: insertRoomsError } = await supabase
      .from("schedule_hotel_room_assignments")
      .insert(roomRows);

    if (insertRoomsError) {
      return NextResponse.json({ message: `객실배정 저장 실패: ${insertRoomsError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
