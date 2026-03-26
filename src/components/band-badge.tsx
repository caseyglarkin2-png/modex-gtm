import { Badge } from "@/components/ui/badge";
import { BAND_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BandBadge({ band }: { band: string }) {
  return (
    <Badge variant="outline" className={cn("font-bold", BAND_COLORS[band] || BAND_COLORS.D)}>
      {band}
    </Badge>
  );
}
