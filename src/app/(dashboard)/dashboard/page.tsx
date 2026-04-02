"use client";

import {
  Upload,
  PlusCircle,
  UserPlus,
  UserMinus,
  UserCheck,
  Mail,
  XCircle,
  Settings,
  Pencil,
  Trash2,
  MessageSquare,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useActivity, useOrganisations, useWorkspaces, useAnalyticsOverview } from "@/lib/api/hooks";
import { formatDistanceToNow } from "date-fns";

import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { ActivityItem } from "@/components/shared/activity-item";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";


const activityIconMap: Record<string, { icon: LucideIcon; iconBg: string }> = {
  "member.joined":       { icon: UserPlus, iconBg: "bg-success-bg" },
  "member.removed":      { icon: UserMinus, iconBg: "bg-destructive/10" },
  "invitation.sent":     { icon: Mail, iconBg: "bg-accent" },
  "invitation.accepted": { icon: UserCheck, iconBg: "bg-success-bg" },
  "invitation.revoked":  { icon: XCircle, iconBg: "bg-warning-bg" },
  "workspace.updated":   { icon: Settings, iconBg: "bg-muted" },
  "app.created":         { icon: PlusCircle, iconBg: "bg-primary/10" },
  "app.updated":         { icon: Pencil, iconBg: "bg-accent" },
  "app.deleted":         { icon: Trash2, iconBg: "bg-destructive/10" },
  "tour.created":        { icon: PlusCircle, iconBg: "bg-primary/10" },
  "tour.updated":        { icon: Pencil, iconBg: "bg-accent" },
  "tour.published":      { icon: Upload, iconBg: "bg-success-bg" },
  "tour.deleted":        { icon: Trash2, iconBg: "bg-destructive/10" },
};

const defaultActivityIcon = { icon: MessageSquare, iconBg: "bg-muted" };

function formatCompact(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

function MetricSkeleton() {
  return (
    <div className="animate-pulse rounded-lg bg-card p-8">
      <div className="space-y-6">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-12 w-32 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: activityData, isLoading: activityLoading } = useActivity(1, 10);
  const { data: orgsData, isLoading: orgsLoading } = useOrganisations(1, 1);
  const orgId = orgsData?.items?.[0]?.id ?? 0;
  const subscriptionStatus = orgsData?.items?.[0]?.subscriptionStatus;
  const isSubscriptionActive =
    subscriptionStatus === "Trialing" ||
    subscriptionStatus === "Active" ||
    subscriptionStatus === "PastDue";

  // Get the first workspace in the org for analytics
  const { data: workspacesData } = useWorkspaces(isSubscriptionActive ? orgId : 0);
  const workspaceId = workspacesData?.items?.[0]?.id ?? 0;

  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview(
    isSubscriptionActive ? workspaceId : 0,
  );

  const dailyMetrics = analytics?.dailyMetrics ?? [];
  const maxSessions = Math.max(...dailyMetrics.map((d) => d.sessions), 1);

  // Empty state: no organisations (shouldn't normally happen -- registration auto-creates one)
  if (!orgsLoading && orgsData && orgsData.items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <Building2 className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-heading">No Organisation Found</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Something went wrong. Please contact support or try logging out and back in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Overview"
        description="Welcome back. Here is what's happening with your tours today."
      />

      {/* Onboarding checklist — shown until all steps are complete */}
      <OnboardingChecklist />

      {/* Metrics Grid */}
      <SubscriptionGate status={subscriptionStatus} feature="dashboard analytics" orgId={orgId}>
      <div className="grid grid-cols-3 gap-6">
        {analyticsLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Tours"
              value={String(analytics?.totalTours ?? 0)}
            />
            <MetricCard
              label="Total Sessions"
              value={formatCompact(analytics?.totalSessions ?? 0)}
            />
            <MetricCard
              label="Completion Rate"
              value={`${(analytics?.completionRate ?? 0).toFixed(1)}%`}
              variant="primary"
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="col-span-2 rounded-lg bg-card p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-heading">
              Recent Activity
            </h2>
            <button className="text-sm font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground">
              View All
            </button>
          </div>

          <div className="divide-y divide-border">
            {activityLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading activity...
              </div>
            ) : activityData?.items && activityData.items.length > 0 ? (
              activityData.items.map((activity) => {
                const iconConfig =
                  activityIconMap[activity.type] ?? defaultActivityIcon;
                const IconComponent = iconConfig.icon;
                return (
                  <ActivityItem
                    key={activity.id}
                    icon={<IconComponent className="size-4" />}
                    iconBg={iconConfig.iconBg}
                    title={
                      <>
                        {activity.description}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {activity.workspaceName}
                        </span>
                      </>
                    }
                    description={`by ${activity.actorName}`}
                    timestamp={formatDistanceToNow(
                      new Date(activity.timestamp),
                      { addSuffix: true }
                    )}
                    className="px-0"
                  />
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Daily Sessions Chart */}
        <div className="col-span-1">
          <div className="rounded-lg border bg-card p-8">
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Sessions
            </h3>

            {analyticsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="animate-pulse text-sm text-muted-foreground">
                  Loading...
                </p>
              </div>
            ) : dailyMetrics.length > 0 ? (
              <div className="flex h-40 gap-1">
                {dailyMetrics.map((day) => {
                  const heightPct = (day.sessions / maxSessions) * 100;
                  return (
                    <div
                      key={day.date}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <div
                        className="w-full rounded-t bg-primary transition-colors group-hover:bg-primary/80"
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                      <div className="pointer-events-none absolute -top-8 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
                        {day.sessions}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No session data yet
                </p>
              </div>
            )}

            {dailyMetrics.length > 0 && (
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>{dailyMetrics[0]?.date?.slice(5)}</span>
                <span>{dailyMetrics[dailyMetrics.length - 1]?.date?.slice(5)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </SubscriptionGate>
    </div>
  );
}
