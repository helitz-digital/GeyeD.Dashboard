import { cn } from "@/lib/utils";

interface CompletionBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function CompletionBar({
  value,
  label = "Completion",
  className,
}: CompletionBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold",
            value > 0 ? "text-primary" : "text-muted-foreground"
          )}
        >
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
