export function formatReservationPrintTime(value?: string) {
  if (!value) return "인쇄 기록 없음";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "인쇄 시간 확인 불가";
  return new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
}

export async function recordReservationPrint(scheduleId: string): Promise<string> {
  const response = await fetch(`/api/reservations/${encodeURIComponent(scheduleId)}/print`, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok || response.redirected) {
    throw new Error("인쇄 시간을 저장하지 못했습니다. 로그인 상태를 확인하고 다시 시도해주세요.");
  }
  const payload: unknown = await response.json();
  const printedAt = payload && typeof payload === "object" && "printedAt" in payload ? payload.printedAt : undefined;
  if (typeof printedAt !== "string" || !Number.isFinite(Date.parse(printedAt))) {
    throw new Error("인쇄 시간 응답이 올바르지 않습니다. 다시 시도해주세요.");
  }
  return printedAt;
}
