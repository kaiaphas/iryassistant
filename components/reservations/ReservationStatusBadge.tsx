import { StatusBadge } from "@/components/common/StatusBadge";

export function ReservationStatusBadge({ status }: { status: string }) {
  return <StatusBadge value={status} />;
}
