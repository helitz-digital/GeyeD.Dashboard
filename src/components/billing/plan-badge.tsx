import { cn } from "@/lib/utils";
import type { PlanType } from "@/lib/api/types";

const planColors: Record<PlanType, string> = {
  None: "",
  Starter: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Lifetime: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Enterprise: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

interface PlanBadgeProps {
  plan: PlanType;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  if (plan === "None") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        planColors[plan],
      )}
    >
      {plan}
    </span>
  );
}
