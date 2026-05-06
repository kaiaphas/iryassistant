import { Badge } from "@/components/ui/badge";

export function StatusBadge({ value }: { value?: string }) {
  const text = value || "미정";
  const variant =
    text.includes("취소") || text.includes("중지")
      ? "danger"
      : text.includes("대기") || text.includes("필요") || text.includes("정비")
        ? "warning"
        : text.includes("진행") || text.includes("배정") || text.includes("운영")
          ? "blue"
          : text.includes("완료") || text.includes("가능") || text.includes("확정") || text.includes("유효")
            ? "default"
            : "secondary";

  return <Badge variant={variant} className="whitespace-nowrap">{text}</Badge>;
}
