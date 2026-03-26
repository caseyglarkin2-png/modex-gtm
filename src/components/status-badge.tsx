import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_COLORS[status] || "bg-neutral-500/15 text-neutral-500 border-neutral-500/25")}>
      {status}
    </Badge>
  );
}
