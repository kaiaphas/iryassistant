import { NextRequest, NextResponse } from "next/server";
import { upsertHotelToSupabase } from "@/repositories/supabase/master-repository";
import type { Hotel, RoomRate } from "@/lib/types";

function cleanRate(rate: RoomRate): RoomRate {
  return {
    weekday: Number(rate.weekday) || 0,
    friday: Number(rate.friday) || 0,
    saturday: Number(rate.saturday) || 0,
    peak: Number(rate.peak) || 0,
    breakfast: Number(rate.breakfast) || 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const hotel = (await request.json()) as Hotel;
    if (!hotel.shopName?.trim()) {
      return NextResponse.json({ message: "상호명을 입력해주세요." }, { status: 400 });
    }

    const saved = await upsertHotelToSupabase({
      ...hotel,
      regionName: hotel.regionName?.trim() ?? "",
      shopName: hotel.shopName.trim(),
      roomRates: {
        double: cleanRate(hotel.roomRates.double),
        triple: cleanRate(hotel.roomRates.triple),
        quad: cleanRate(hotel.roomRates.quad),
      },
      phone: hotel.phone?.trim() ?? "",
      address: hotel.address?.trim() ?? "",
      note: hotel.note?.trim() ?? "",
      driverBenefit: hotel.driverBenefit ?? "미제공",
      guideBenefit: hotel.guideBenefit ?? "미제공",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "호텔 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
