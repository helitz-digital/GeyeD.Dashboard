"use client";

import { PricingTable } from "./pricing-table";
import type { PlanType, SubscriptionStatus, CreateCheckoutRequest, PlanInfoRm } from "@/lib/api/types";

interface PaywallOverlayProps {
  status: SubscriptionStatus;
  currentPlan: PlanType;
  plans: PlanInfoRm[];
  onSelectPlan: (data: CreateCheckoutRequest) => void;
  isLoading: boolean;
}

export function PaywallOverlay({
  status,
  currentPlan,
  plans,
  onSelectPlan,
  isLoading,
}: PaywallOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl space-y-8 px-6 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Upgrade to continue
          </h2>
          <p className="text-muted-foreground">
            Your current plan doesn&apos;t include access to this feature.
            Choose a plan to unlock everything Geyed has to offer.
          </p>
        </div>
        <PricingTable
          currentPlan={currentPlan}
          currentStatus={status}
          plans={plans}
          onSelectPlan={onSelectPlan}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
