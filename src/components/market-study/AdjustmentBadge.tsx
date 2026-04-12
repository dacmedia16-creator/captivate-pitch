import { cn } from "@/lib/utils";

interface AdjustmentBadgeProps {
  direction: "positive" | "negative" | "neutral";
  percentage: number;
  label?: string;
  className?: string;
}

export function AdjustmentBadge({ direction, percentage, label, className }: AdjustmentBadgeProps) {
  const colors = {
    positive: "bg-emerald-100 text-emerald-700 border-emerald-200",
    negative: "bg-red-100 text-red-700 border-red-200",
    neutral: "bg-muted text-muted-foreground border-border",
  };

  const sign = percentage > 0 ? "+" : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        colors[direction],
        className
      )}
    >
      {label && <span>{label}</span>}
      <span>{sign}{percentage.toFixed(1)}%</span>
    </span>
  );
}
