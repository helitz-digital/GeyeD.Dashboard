"use client";

import Link from "next/link";
import {
  Check,
  Circle,
  Compass,
  AppWindow,
  Pencil,
  Code2,
  Rocket,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboarding } from "@/providers/onboarding-provider";
import { useActiveWorkspace } from "@/providers/active-workspace-provider";
import type { OnboardingStage } from "@/lib/api/types";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

interface StepDef {
  /** Which backend stages this UI step covers (current stage ∈ stages → this is the active step). */
  stages: OnboardingStage[];
  label: string;
  description: string;
  icon: typeof AppWindow;
  actionLabel: string;
  getHref: (ctx: RouteCtx) => string | null;
}

interface RouteCtx {
  orgId: number | null;
  wsId: number | null;
  appId: number | null;
  tourId: number | null;
}

const STEPS: StepDef[] = [
  {
    stages: ["notStarted"],
    label: "Take the tour",
    description: "A quick walkthrough of the platform to get you oriented.",
    icon: Compass,
    actionLabel: "Start Tour",
    getHref: () => null, // Tour starts automatically on the dashboard
  },
  {
    stages: ["orientationComplete"],
    label: "Create your first app",
    description: "Add your website or product as an app to get started.",
    icon: AppWindow,
    actionLabel: "Go to Apps",
    getHref: () => `/apps`,
  },
  {
    stages: ["appCreated"],
    label: "Build your first tour",
    description: "Edit the sample tour we created — customise the steps for your users.",
    icon: Pencil,
    actionLabel: "Edit Tour",
    getHref: (ctx) => {
      if (!ctx.appId || !ctx.tourId) return null;
      return `/apps/${ctx.appId}/tours/${ctx.tourId}`;
    },
  },
  {
    stages: ["tourCreated"],
    label: "Install the SDK",
    description: "Add the code snippet to your website so tours can run.",
    icon: Code2,
    actionLabel: "View Setup",
    getHref: (ctx) => {
      if (!ctx.appId) return null;
      return `/apps/${ctx.appId}/setup`;
    },
  },
  {
    stages: ["sdkInstalled"],
    label: "Go live",
    description: "Publish your tour so your users see it on their next visit.",
    icon: Rocket,
    actionLabel: "Open Tour",
    getHref: (ctx) => {
      if (!ctx.appId || !ctx.tourId) return null;
      return `/apps/${ctx.appId}/tours/${ctx.tourId}`;
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the index of the step that corresponds to `stage`, or STEPS.length if complete. */
function stageToStepIndex(stage: OnboardingStage): number {
  if (stage === "complete") return STEPS.length;
  const idx = STEPS.findIndex((s) => s.stages.includes(stage));
  return idx === -1 ? 0 : idx;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OnboardingChecklistProps {
  onClose?: () => void;
}

export function OnboardingChecklist({ onClose }: OnboardingChecklistProps = {}) {
  const { currentStage, isOnboarding, appId, tourId, skipOnboarding } =
    useOnboarding();
  const { orgId, wsId } = useActiveWorkspace();

  if (!isOnboarding || !currentStage) return null;

  const currentIndex = stageToStepIndex(currentStage);
  const progressPercent = (currentIndex / STEPS.length) * 100;
  const ctx: RouteCtx = { orgId, wsId, appId, tourId };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-heading">
            Get started with Geyed
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete these steps to launch your first product tour.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            skipOnboarding();
            onClose?.();
          }}
          className="text-muted-foreground"
        >
          <X className="size-3.5" />
          <span className="sr-only">Dismiss onboarding</span>
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <Progress value={progressPercent}>
          <span className="text-xs text-muted-foreground">
            {currentIndex} of {STEPS.length} complete
          </span>
        </Progress>
      </div>

      {/* Steps */}
      <div className="mt-5 space-y-1">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          const Icon = step.icon;
          const href = isCurrent ? step.getHref(ctx) : null;

          return (
            <div
              key={step.label}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                isCurrent
                  ? "bg-primary/5 border border-primary/20"
                  : isDone
                    ? "opacity-60"
                    : "opacity-40"
              }`}
            >
              {/* Status indicator */}
              <div className="flex size-6 shrink-0 items-center justify-center">
                {isDone ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary">
                    <Check className="size-3 text-primary-foreground" />
                  </div>
                ) : isCurrent ? (
                  <div className="flex size-5 items-center justify-center rounded-full border-2 border-primary">
                    <Circle className="size-2 fill-primary text-primary" />
                  </div>
                ) : (
                  <div className="flex size-5 items-center justify-center rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>

              {/* Icon + text */}
              <Icon
                className={`size-4 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Action */}
              {isCurrent && href && (
                <Button size="sm" className="shrink-0 gap-1" render={<Link href={href} />}>
                  {step.actionLabel}
                  <ChevronRight className="size-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
