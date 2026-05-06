import { NextRequest, NextResponse } from "next/server";
import { upsertRestaurantToSupabase } from "@/repositories/supabase/master-repository";
import type { Restaurant } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const restaurant = (await request.json()) as Restaurant;
    if (!restaurant.shopName?.trim()) {
      return NextResponse.json({ message: "상호명을 입력해주세요." }, { status: 400 });
    }

    const saved = await upsertRestaurantToSupabase({
      ...restaurant,
      productName: restaurant.productName?.trim() ?? "",
      regionName: restaurant.regionName?.trim() ?? "",
      shopName: restaurant.shopName.trim(),
      menu: restaurant.menu?.trim() ?? "",
      retailPrice: Number(restaurant.retailPrice) || 0,
      depositPrice: Number(restaurant.depositPrice) || 0,
      serviceType: restaurant.serviceType ?? "없음",
      phone: restaurant.phone?.trim() ?? "",
      address: restaurant.address?.trim() ?? "",
      note: restaurant.note?.trim() ?? "",
    });

    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "식당 저장 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
