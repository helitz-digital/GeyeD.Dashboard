"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubscriptionStatus } from "@/lib/api/types";

interface SubscriptionGateProps {
  status: SubscriptionStatus | undefined;
  children: React.ReactNode;
  /** Feature name shown in the locked message, e.g. "analytics" */
  feature?: string;
  /** Organisation ID for the billing link */
  orgId?: number;
}

/**
 * Wraps page content and shows a subscription-required overlay
 * when the organisation has no active subscription.
 *
 * Active statuses: Trialing, Active, PastDue (read-only access).
 * Blocked statuses: None, Canceled, Unpaid.
 */
export function SubscriptionGate({
  status,
  children,
  feature = "this feature",
  orgId,
}: SubscriptionGateProps) {
  const isActive =
    status === "Trialing" ||
    status === "Active" ||
    status === "PastDue";

  if (status === undefined) {
    // Still loading — don't flash paywall
    return <>{children}</>;
  }

  if (isActive) {
    return <>{children}</>;
  }

  const isCanceled = status === "Canceled";
  const billingHref = orgId ? `/org/${orgId}/billing` : "/dashboard";

  return (
    <div className="relative">
      {/* Blurred content behind the gate */}
      <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="mx-auto max-w-md space-y-4 rounded-lg border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {isCanceled
              ? "Subscription expired"
              : "Subscription required"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isCanceled
              ? `Your subscription has been canceled. Reactivate your plan to access ${feature}.`
              : `You need an active subscription to access ${feature}. Choose a plan to get started.`}
          </p>
          <Link href={billingHref}>
            <Button className="w-full">
              {isCanceled ? "Reactivate plan" : "View plans"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
