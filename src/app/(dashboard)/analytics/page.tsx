"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useOrganisations,
  useWorkspaces,
  useAnalyticsOverview,
  useTourAnalytics,
} from "@/lib/api/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { CompletionBar } from "@/components/shared/completion-bar";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function StepFunnelChart({ tourId }: { tourId: number }) {
  const { data, isLoading } = useTourAnalytics(tourId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="animate-pulse text-sm text-muted-foreground">
          Loading funnel...
        </p>
      </div>
    );
  }

  if (!data || data.stepFunnel.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No funnel data available for this tour.
      </p>
    );
  }

  const maxViews = Math.max(...data.stepFunnel.map((s) => s.views), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Total Sessions"
          value={formatCompact(data.totalSessions)}
        />
        <MetricCard
          label="Completion Rate"
          value={`${data.completionRate.toFixed(1)}%`}
        />
        <MetricCard
          label="Dismissal Rate"
          value={`${data.dismissalRate.toFixed(1)}%`}
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Step Funnel
        </h4>
        <div className="space-y-3">
          {data.stepFunnel.map((step) => {
            const widthPct = (step.views / maxViews) * 100;
            return (
              <div key={step.stepIndex} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {step.stepIndex + 1}. {step.stepTitle || "Untitled"}
                  </span>
                  <span className="text-muted-foreground">
                    {step.views} views &middot; {step.dropOffRate.toFixed(1)}%
                    drop-off
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(widthPct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: orgsData, isLoading: orgsLoading } = useOrganisations(1, 50);
  const orgs = orgsData?.items ?? [];

  const [selectedOrgId, setSelectedOrgId] = useState<number>(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const tourParam = searchParams.get("tour");
  const parsedTour = tourParam ? Number(tourParam) : null;
  const selectedTourId = parsedTour && Number.isFinite(parsedTour) ? parsedTour : null;

  // Auto-select first org
  const effectiveOrgId = selectedOrgId || orgs[0]?.id || 0;

  // Get subscription status from the org
  const selectedOrg = orgs.find((o) => o.id === effectiveOrgId);
  const subscriptionStatus = selectedOrg?.subscriptionStatus;
  const isSubscriptionActive =
    subscriptionStatus === "Trialing" ||
    subscriptionStatus === "Active" ||
    subscriptionStatus === "PastDue";

  // Get the first workspace in the org for analytics
  const { data: workspacesData } = useWorkspaces(isSubscriptionActive ? effectiveOrgId : 0);
  const workspaceId = workspacesData?.items?.[0]?.id ?? 0;

  const { data: analytics, isLoading: analyticsLoading } =
    useAnalyticsOverview(isSubscriptionActive ? workspaceId : 0);

  const dailyMetrics = analytics?.dailyMetrics ?? [];
  const maxSessions = Math.max(...dailyMetrics.map((d) => d.sessions), 1);
  const topTours = analytics?.topTours ?? [];

  if (selectedTourId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/analytics")}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Overview
          </Button>
        </div>
        <StepFunnelChart tourId={selectedTourId} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Track tour performance across your organisation."
      />

      {/* Org Selector */}
      {orgsLoading ? (
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      ) : orgs.length > 1 ? (
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Organisation
          </span>
          <Select
            value={String(effectiveOrgId)}
            onValueChange={(val: string | null) => {
              if (val) setSelectedOrgId(Number(val));
            }}
          >
            <SelectTrigger className="w-56 bg-muted border border-border rounded">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orgs.map((org) => (
                <SelectItem key={org.id} value={String(org.id)}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <SubscriptionGate status={subscriptionStatus} feature="analytics" orgId={effectiveOrgId}>
      {/* Metrics Grid */}
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

      {/* Daily Sessions Chart */}
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
            <span>
              {dailyMetrics[dailyMetrics.length - 1]?.date?.slice(5)}
            </span>
          </div>
        )}
      </div>

      {/* Top Tours Table */}
      {topTours.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">
              Top Tours
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tour Name
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Sessions
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Completion
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topTours.map((tour) => (
                <TableRow
                  key={tour.tourId}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/analytics?tour=${tour.tourId}`)}
                >
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">
                      {tour.tourName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">
                      {formatCompact(tour.sessions)}
                    </span>
                  </TableCell>
                  <TableCell className="w-36">
                    <CompletionBar value={tour.completionRate} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!analyticsLoading && topTours.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border bg-card py-12">
          <p className="text-sm text-muted-foreground">
            No tour data available yet. Create and publish tours to see
            analytics.
          </p>
        </div>
      )}
      </SubscriptionGate>
    </div>
  );
}
