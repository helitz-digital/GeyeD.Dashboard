import { cn } from "@/lib/utils";

interface ActivityItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: React.ReactNode;
  description: string;
  timestamp: string;
  className?: string;
}

export function ActivityItem({
  icon,
  iconBg,
  title,
  description,
  timestamp,
  className,
}: ActivityItemProps) {
  return (
    <div className={cn("flex gap-4 px-8 py-6", className)}>
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          iconBg
        )}
      >
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between">
          <p className="text-base font-bold text-foreground">{title}</p>
          <span className="ml-4 shrink-0 text-xs font-medium text-muted-foreground">
            {timestamp}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
