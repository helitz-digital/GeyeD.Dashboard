import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tight",
  {
    variants: {
      status: {
        published: "bg-success-bg text-success",
        draft: "bg-warning-bg text-warning",
        preview: "bg-info-bg text-info",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {status}
    </span>
  );
}
