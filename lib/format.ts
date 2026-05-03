export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function daysUntil(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const today = new Date("2026-05-02T00:00:00+09:00");
  const target = new Date(`${value}T00:00:00+09:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}
