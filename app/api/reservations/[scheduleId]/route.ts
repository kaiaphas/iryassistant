import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";
import type { ScheduleGroup } from "@/lib/types";
import { getScheduleProgressStatus } from "@/lib/reservation-status";

type RouteContext = {
  params: Promise<{
    scheduleId: string;
  }>;
};

function emptyIfPlaceholder(value: string | undefined) {
  const trimmed = value?.trim();
  return !trimmed || trimmed === "-" ? "" : value ?? "";
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { scheduleId } = await context.params;
  const schedule = (await request.json()) as ScheduleGroup;
  const supabase = createSupabaseServerClient();

  if (!scheduleId || scheduleId !== schedule.id) {
    return NextResponse.json({ message: "일정 ID가 올바르지 않습니다." }, { status: 400 });
  }
  const progressStatus = getScheduleProgressStatus(schedule);
  const scheduleForSave: ScheduleGroup = {
    ...schedule,
    departureTime: emptyIfPlaceholder(schedule.departureTime),
    vehicle: {
      ...schedule.vehicle,
      busInfo: "",
      busCompany: emptyIfPlaceholder(schedule.vehicle.busCompany),
      busType: emptyIfPlaceholder(schedule.vehicle.busType),
    },
  };
  const { error } = await supabase.rpc("save_reservation_schedule_atomic", {
    p_schedule: {
      ...scheduleForSave,
      progressStatus,
    },
  });

  if (error) {
    return NextResponse.json({ message: `예약현황 저장 실패: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
