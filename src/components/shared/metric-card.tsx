import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  variant?: "default" | "primary";
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-8",
        isPrimary ? "bg-primary" : "bg-card",
        className
      )}
    >
      <div className="space-y-6">
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            isPrimary
              ? "text-primary-foreground/60"
              : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <div className="flex items-end gap-3">
          <span
            className={cn(
              "text-5xl font-extrabold tracking-tighter",
              isPrimary ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {value}
          </span>
          {trend && (
            <div className="flex items-center pb-2">
              {trend.direction === "up" ? (
                <ArrowUp
                  className={cn(
                    "size-3.5",
                    isPrimary
                      ? "text-primary-foreground/80"
                      : "text-success"
                  )}
                />
              ) : (
                <ArrowDown
                  className={cn(
                    "size-3.5",
                    isPrimary
                      ? "text-primary-foreground/80"
                      : "text-destructive"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm font-bold",
                  isPrimary
                    ? "text-primary-foreground/80"
                    : trend.direction === "up"
                      ? "text-success"
                      : "text-destructive"
                )}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
