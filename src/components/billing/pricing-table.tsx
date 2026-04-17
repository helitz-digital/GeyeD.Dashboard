"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlanType, SubscriptionStatus, CreateCheckoutRequest, PlanInfoRm } from "@/lib/api/types";

function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "Custom";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

interface PricingTableProps {
  currentPlan: PlanType;
  currentStatus: SubscriptionStatus;
  plans: PlanInfoRm[];
  onSelectPlan: (data: CreateCheckoutRequest) => void;
  isLoading: boolean;
}

export function PricingTable({
  currentPlan,
  currentStatus,
  plans,
  onSelectPlan,
  isLoading,
}: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const isCurrentPlan = (planName: string) =>
    currentPlan === planName && currentStatus !== "Canceled" && currentStatus !== "None";

  // Separate lifetime plan from regular plans
  const lifetimePlan = plans.find((p) => p.name === "Lifetime");
  const regularPlans = plans.filter((p) => p.name !== "Lifetime");

  return (
    <div className="space-y-6">
      {/* Lifetime deal banner */}
      {lifetimePlan && (() => {
        const planPrices = lifetimePlan.prices["usd"];
        const displayPrice = formatPrice(planPrices?.oneTime);
        const isCurrentLifetime = isCurrentPlan("Lifetime");

        return (
          <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-6">
            <div className="absolute -right-4 -top-4 size-24 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-500" />
                  <h3 className="text-lg font-bold tracking-tight">
                    Lifetime Deal
                  </h3>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Limited time
                  </span>
                </div>
                <p className="max-w-lg text-sm text-muted-foreground">
                  {lifetimePlan.description} Pay once, use forever. Available during our launch period only.
                </p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {lifetimePlan.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="size-3 shrink-0 text-amber-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div>
                  <span className="text-3xl font-bold tracking-tight">{displayPrice}</span>
                  <span className="ml-1 text-sm text-muted-foreground">one-time</span>
                </div>
                {isCurrentLifetime ? (
                  <Button disabled className="w-full sm:w-auto">
                    Current plan
                  </Button>
                ) : (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() =>
                      onSelectPlan({
                        planType: "Lifetime" as PlanType,
                        billingCycle: "lifetime",
                      })
                    }
                    disabled={isLoading}
                  >
                    Get lifetime access
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === "annual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setBillingCycle("annual")}
          >
            Annual
            <span className="ml-1.5 text-xs font-semibold text-emerald-600">save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan cards -- always 3 columns (Starter, Pro, Enterprise) */}
      <div className="grid gap-6 md:grid-cols-3">
        {regularPlans.map((plan) => {
          const isEnterprise = plan.name === "Enterprise";
          const isPro = plan.name === "Pro";

          const planPrices = plan.prices["usd"];
          const price =
            billingCycle === "monthly"
              ? planPrices?.monthly
              : planPrices?.annual;

          const displayPrice = isEnterprise
            ? "Custom"
            : formatPrice(price);

          return (
            <Card
              key={plan.name}
              className={`flex h-full flex-col ${
                isPro ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  {isEnterprise ? (
                    <span className="text-3xl font-bold tracking-tight">Custom</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold tracking-tight">
                        {displayPrice}
                      </span>
                      {displayPrice !== "Custom" && (
                        <span className="text-sm text-muted-foreground">/month</span>
                      )}
                      {billingCycle === "annual" && price != null && (
                        <span className="ml-2 text-xs font-medium text-emerald-600">billed annually</span>
                      )}
                    </>
                  )}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                {isCurrentPlan(plan.name) ? (
                  <Button className="w-full" disabled>
                    Current plan
                  </Button>
                ) : isEnterprise ? (
                  <a
                    href="mailto:sales@geyed.io"
                    className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-all hover:bg-muted hover:text-foreground"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() =>
                      onSelectPlan({
                        planType: plan.name as PlanType,
                        billingCycle,
                      })
                    }
                    disabled={isLoading}
                  >
                    Get started
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
