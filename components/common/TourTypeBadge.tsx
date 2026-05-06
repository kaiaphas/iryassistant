import { Badge } from "@/components/ui/badge";

export function TourTypeBadge({ value }: { value?: "당일" | "숙박" | string }) {
  if (value === "숙박") {
    return <Badge variant="default" className="whitespace-nowrap">숙박</Badge>;
  }

  return <Badge variant="blue" className="whitespace-nowrap">당일</Badge>;
}
