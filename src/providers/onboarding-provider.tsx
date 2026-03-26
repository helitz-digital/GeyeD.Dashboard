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
} from "@/lib/api/hooks";
import {
  allOnboardingTours,
  ONBOARDING_TOUR_IDS,
} from "@/components/onboarding/onboarding-tours";
import { ContinuePrompt } from "@/components/onboarding/continue-prompt";
import { Celebration } from "@/components/onboarding/celebration";
import {
  getSdk,
  type SdkEventCallback,
} from "@/components/onboarding/sdk-bridge";

// ---------------------------------------------------------------------------
// Stage → Tour mapping
// ---------------------------------------------------------------------------

const STAGE_TOUR_MAP: Record<string, number | undefined> = {
  NotStarted: ONBOARDING_TOUR_IDS.ORIENTATION,
  OrientationComplete: ONBOARDING_TOUR_IDS.CREATE_APP,
  AppCreated: ONBOARDING_TOUR_IDS.BUILD_TOUR,
  TourCreated: ONBOARDING_TOUR_IDS.INSTALL_SDK,
  SdkInstalled: ONBOARDING_TOUR_IDS.PUBLISH,
};

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
  advanceStage: (stage: OnboardingStage, meta?: { appId?: number }) => void;
  triggerCurrentTour: () => void;
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

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: status } = useOnboardingStatus();
  const completeStage = useCompleteOnboardingStage();
  const createSampleTour = useCreateSampleTour();
  const skip = useSkipOnboarding();
  const reset = useResetOnboarding();

  const [tourDismissed, setTourDismissed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const currentStage = status?.stage ?? null;
  const isOnboarding =
    !!currentStage && currentStage !== "Complete" && !showCelebration;

  // Keep refs so event handlers don't re-subscribe on every render
  const completeStageRef = useRef(completeStage);
  completeStageRef.current = completeStage;

  const createSampleTourRef = useRef(createSampleTour);
  createSampleTourRef.current = createSampleTour;

  const statusRef = useRef(status);
  statusRef.current = status;

  // -----------------------------------------------------------------------
  // Initialise the SDK once with the onboarding tour definitions
  // -----------------------------------------------------------------------
  useEffect(() => {
    const sdk = getSdk();
    sdk.init({ tours: allOnboardingTours as Parameters<typeof sdk.init>[0]["tours"], debug: false });
    setSdkReady(true);

    return () => {
      sdk.destroy();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Listen for SDK events (tour_completed / tour_dismissed)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!sdkReady) return;

    const sdk = getSdk();

    const handleComplete: SdkEventCallback = (data) => {
      const tourId = data.tourId;
      const s = statusRef.current;

      // Map completed tour back to the stage it satisfies
      if (tourId === ONBOARDING_TOUR_IDS.ORIENTATION) {
        completeStageRef.current.mutate({ stage: "OrientationComplete" });
      } else if (tourId === ONBOARDING_TOUR_IDS.CREATE_APP) {
        // App creation is handled by the actual create-app flow, not tour completion
      } else if (tourId === ONBOARDING_TOUR_IDS.BUILD_TOUR) {
        completeStageRef.current.mutate({ stage: "TourCreated" });
      } else if (tourId === ONBOARDING_TOUR_IDS.INSTALL_SDK) {
        completeStageRef.current.mutate({ stage: "SdkInstalled" });
      } else if (tourId === ONBOARDING_TOUR_IDS.PUBLISH) {
        completeStageRef.current.mutate({ stage: "Complete" });
        if (s?.defaultOrgId && s?.defaultWorkspaceId && s?.appId) {
          setShowCelebration(true);
        }
      }

      setTourDismissed(false);
    };

    const handleDismiss: SdkEventCallback = () => {
      setTourDismissed(true);
    };

    sdk.on("tour_completed", handleComplete);
    sdk.on("tour_dismissed", handleDismiss);

    return () => {
      sdk.off("tour_completed", handleComplete);
      sdk.off("tour_dismissed", handleDismiss);
    };
  }, [sdkReady]);

  // -----------------------------------------------------------------------
  // Auto-trigger the appropriate tour when the stage changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!sdkReady || !currentStage || currentStage === "Complete") return;

    const tourId = STAGE_TOUR_MAP[currentStage];
    if (!tourId) return;

    const timer = setTimeout(() => {
      // Guard: stage may have changed during the delay
      if (statusRef.current?.stage !== currentStage) return;

      const sdk = getSdk();
      sdk.startTour(tourId).catch(() => {
        // Target selectors may not exist yet – silently ignore
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [sdkReady, currentStage]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  const triggerCurrentTour = useCallback(() => {
    if (!currentStage || currentStage === "Complete") return;
    const tourId = STAGE_TOUR_MAP[currentStage];
    if (!tourId) return;

    setTourDismissed(false);
    const sdk = getSdk();
    sdk.startTour(tourId).catch(() => {});
  }, [currentStage]);

  const handleSkip = useCallback(() => {
    skip.mutate();
  }, [skip]);

  const handleRestart = useCallback(() => {
    setShowCelebration(false);
    setTourDismissed(false);
    reset.mutate();
  }, [reset]);

  const advanceStage = useCallback(
    (stage: OnboardingStage, meta?: { appId?: number }) => {
      completeStage.mutate({ stage });

      // When app is created, also create the sample tour for onboarding Stage 3
      if (stage === "AppCreated" && meta?.appId) {
        createSampleTour.mutate({ appId: meta.appId });
      }
    },
    [completeStage, createSampleTour],
  );

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
    triggerCurrentTour,
  };

  return (
    <OnboardingContext value={value}>
      {children}

      {/* Continue prompt when user dismisses a tour mid-onboarding */}
      {isOnboarding && tourDismissed && (
        <ContinuePrompt
          onContinue={triggerCurrentTour}
          onSkip={handleSkip}
        />
      )}

      {/* Celebration overlay on completion */}
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
