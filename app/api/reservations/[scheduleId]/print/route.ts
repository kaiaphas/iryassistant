import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

export async function POST(request: NextRequest, context: { params: Promise<{ scheduleId: string }> }) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }
  const { scheduleId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scheduleId)) {
    return NextResponse.json({ message: "일정 ID가 올바르지 않습니다." }, { status: 400 });
  }
  try {
    if (!await getCurrentMember()) {
      return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc("record_reservation_customers_print", { p_schedule_id: scheduleId });
    if (error) {
      return NextResponse.json({ message: "인쇄 시간을 저장하지 못했습니다." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ message: "인쇄할 일정을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ printedAt: data });
  } catch {
    return NextResponse.json({ message: "인쇄 시간을 저장하지 못했습니다." }, { status: 500 });
  }
}
