interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-12">
      <div className="space-y-2">
        <h1 data-onboarding="main-heading" className="text-4xl font-extrabold tracking-tight text-heading">
          {title}
        </h1>
        {description && (
          <p className="text-base font-medium text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
