"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { OnboardingStage } from "@/lib/api/types";
import {
  useOnboardingStatus,
  useCompleteOnboardingStage,
  useCreateSampleTour,
  useSkipOnboarding,
  useResetOnboarding,
  useOrganisations,
} from "@/lib/api/hooks";
import { Celebration } from "@/components/onboarding/celebration";
import {
  getSdk,
  type SdkEventCallback,
} from "@/components/onboarding/sdk-bridge";
import {
  allOnboardingTours,
  ONBOARDING_TOUR_IDS,
} from "@/components/onboarding/onboarding-tours";

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

interface OnboardingContextValue {
  currentStage: OnboardingStage | null;
  isOnboarding: boolean;
  appId: number | null;
  tourId: number | null;
  defaultOrgId: number | null;
  defaultWorkspaceId: number | null;
  skipOnboarding: () => void;
  restartOnboarding: () => void;
  advanceStage: (stage: OnboardingStage, meta?: { appId?: number }) => Promise<void>;
  /** Start a specific SDK overlay tour by ID. Pages call this on mount. */
  startOnboardingTour: (tourId: number) => void;
  /** Signal the topbar to open the help/onboarding tray. */
  requestHelpTrayOpen: () => void;
  /** True when a page has requested the tray to open. Resets after consumption. */
  helpTrayRequested: boolean;
  /** Mark the tray-open request as consumed. */
  consumeHelpTrayRequest: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within <OnboardingProvider>");
  }
  return ctx;
}

// Re-export tour IDs so pages can reference them without importing onboarding-tours directly
export { ONBOARDING_TOUR_IDS };

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: status } = useOnboardingStatus();
  const { data: orgs } = useOrganisations();
  const completeStage = useCompleteOnboardingStage();
  const createSampleTour = useCreateSampleTour();
  const skip = useSkipOnboarding();
  const reset = useResetOnboarding();

  const [showCelebration, setShowCelebration] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [helpTrayRequested, setHelpTrayRequested] = useState(false);
  const prevStageRef = useRef<OnboardingStage | null>(null);

  const currentStage = status?.stage ?? null;
  const hasActiveSubscription = orgs?.items?.some(
    (org) =>
      org.subscriptionStatus === "Trialing" ||
      org.subscriptionStatus === "Active" ||
      org.subscriptionStatus === "PastDue",
  ) ?? false;
  const isOnboarding =
    !!currentStage &&
    currentStage !== "complete" &&
    !showCelebration &&
    hasActiveSubscription;

  // Keep a ref for event handlers
  const completeStageRef = useRef(completeStage);
  completeStageRef.current = completeStage;

  // -----------------------------------------------------------------------
  // Initialise the SDK with all onboarding tour definitions
  // -----------------------------------------------------------------------
  useEffect(() => {
    const sdk = getSdk();
    sdk.init({
      tours: allOnboardingTours,
      debug: false,
    });
    setSdkReady(true);

    return () => {
      sdk.destroy();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Listen for SDK tour completion events to advance stages
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!sdkReady) return;

    const sdk = getSdk();

    const handleComplete: SdkEventCallback = (data) => {
      if (data.tourId === ONBOARDING_TOUR_IDS.ORIENTATION) {
        completeStageRef.current.mutate({ stage: "orientationComplete" });
      } else if (data.tourId === ONBOARDING_TOUR_IDS.INSTALL_SDK) {
        completeStageRef.current.mutate({ stage: "sdkInstalled" });
      }
    };

    sdk.on("tour_completed", handleComplete);
    return () => {
      sdk.off("tour_completed", handleComplete);
    };
  }, [sdkReady]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleSkip = useCallback(() => {
    skip.mutate();
  }, [skip]);

  const handleRestart = useCallback(() => {
    setShowCelebration(false);
    reset.mutate();
  }, [reset]);

  const advanceStage = useCallback(
    async (stage: OnboardingStage, meta?: { appId?: number }) => {
      const result = await completeStage.mutateAsync({ stage });

      if (stage === "appCreated" && meta?.appId) {
        await createSampleTour.mutateAsync({ appId: meta.appId });
      }

      if (stage === "complete") {
        // Use the mutation response (fresh data) rather than the stale closure
        const s = result ?? status;
        if (s?.defaultOrgId && s?.defaultWorkspaceId && s?.appId) {
          setShowCelebration(true);
        }
      }
    },
    [completeStage, createSampleTour, status],
  );

  const startOnboardingTour = useCallback(
    (tourId: number) => {
      if (!sdkReady || !isOnboarding) return;
      const sdk = getSdk();
      sdk.startTour(tourId).catch(() => {
        // Target selectors may not be in the DOM yet — safe to ignore
      });
    },
    [sdkReady, isOnboarding],
  );

  // Show celebration only when the stage *transitions* to "complete" (not on initial load)
  useEffect(() => {
    const prev = prevStageRef.current;
    prevStageRef.current = currentStage;

    if (
      prev !== null &&
      prev !== "complete" &&
      currentStage === "complete" &&
      status?.defaultOrgId &&
      status?.defaultWorkspaceId &&
      status?.appId
    ) {
      setShowCelebration(true);
    }
  }, [currentStage, status]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const value: OnboardingContextValue = {
    currentStage,
    isOnboarding,
    appId: status?.appId ?? null,
    tourId: status?.tourId ?? null,
    defaultOrgId: status?.defaultOrgId ?? null,
    defaultWorkspaceId: status?.defaultWorkspaceId ?? null,
    skipOnboarding: handleSkip,
    restartOnboarding: handleRestart,
    advanceStage,
    startOnboardingTour,
    requestHelpTrayOpen: useCallback(() => setHelpTrayRequested(true), []),
    helpTrayRequested,
    consumeHelpTrayRequest: useCallback(() => setHelpTrayRequested(false), []),
  };

  return (
    <OnboardingContext value={value}>
      {children}

      {showCelebration &&
        status?.defaultOrgId &&
        status?.defaultWorkspaceId &&
        status?.appId && (
          <Celebration
            onDismiss={() => setShowCelebration(false)}
            orgId={status.defaultOrgId}
            wsId={status.defaultWorkspaceId}
            appId={status.appId}
          />
        )}
    </OnboardingContext>
  );
}
