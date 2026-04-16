"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanBadge } from "@/components/billing/plan-badge";
import { PricingTable } from "@/components/billing/pricing-table";
import {
  useBillingInfo,
  useConfirmCheckout,
  useCreateCheckout,
  useCreatePortalSession,
} from "@/lib/api/hooks";
import { useActiveWorkspace } from "@/providers/active-workspace-provider";
import { useOnboarding } from "@/providers/onboarding-provider";
import type { CreateCheckoutRequest } from "@/lib/api/types";

export default function OrgBillingPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { orgId } = useActiveWorkspace();
  const { requestHelpTrayOpen } = useOnboarding();

  const { data: billing, isLoading: billingLoading } = useBillingInfo(orgId ?? 0);
  const confirmCheckout = useConfirmCheckout(orgId ?? 0);
  const createCheckout = useCreateCheckout(orgId ?? 0);
  const createPortal = useCreatePortalSession(orgId ?? 0);

  // Confirm checkout session from Stripe redirect.
  // Guarded by a ref so React Strict-Mode double-invoke can't double-confirm, and we strip
  // session_id from the URL before mutating so a refresh mid-flight can't re-trigger it.
  const confirmedRef = useRef(false);
  useEffect(() => {
    if (!sessionId || !orgId || confirmedRef.current) return;
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return;
    confirmedRef.current = true;

    const url = new URL(window.location.href);
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", url.toString());

    confirmCheckout.mutate(sessionId, {
      onSuccess: () => {
        toast.success("Payment confirmed! Your plan has been upgraded.");
        requestHelpTrayOpen();
      },
      onError: (error: Error) => {
        toast.error(
          error.message ||
            "Failed to confirm payment. Please contact support if you were charged.",
        );
      },
    });
  }, [sessionId, orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlan = (data: CreateCheckoutRequest) => {
    createCheckout.mutate(data, {
      onSuccess: (result) => {
        window.location.href = result.checkoutUrl;
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to start checkout. Please try again.");
      },
    });
  };

  const handleManageBilling = () => {
    createPortal.mutate(undefined, {
      onSuccess: (result) => {
        window.location.href = result.portalUrl;
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to open billing portal.");
      },
    });
  };

  const isSubscribed =
    billing &&
    billing.subscriptionStatus !== "None" &&
    billing.subscriptionStatus !== "Canceled";

  return (
    <div className="space-y-12">
      <PageHeader
        title="Billing"
        description="Manage your subscription and billing details."
      />

      <div className="max-w-5xl space-y-8">
        {/* Current Plan Summary */}
        {billing && isSubscribed && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Current Plan
                <PlanBadge plan={billing.planType} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">
                    {billing.subscriptionStatus}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Apps</p>
                  <p className="font-medium">
                    {billing.usage.currentApps} / {billing.limits.maxApps}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Members</p>
                  <p className="font-medium">
                    {billing.usage.currentMembers} / {billing.limits.maxMembers}
                  </p>
                </div>
              </div>
              {billing.hasBillingAccount ? (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={createPortal.isPending}
                >
                  <ExternalLink className="mr-2 size-4" />
                  {createPortal.isPending
                    ? "Opening portal..."
                    : "Manage billing"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Billing portal will be available after your first payment.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Plan Selection */}
        {billing && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
              {isSubscribed ? "Change plan" : "Choose a plan"}
            </h2>
            <PricingTable
              currentPlan={billing.planType}
              currentStatus={billing.subscriptionStatus}
              plans={billing.availablePlans}
              onSelectPlan={handleSelectPlan}
              isLoading={createCheckout.isPending}
            />
          </div>
        )}

        {billingLoading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Loading billing information...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
