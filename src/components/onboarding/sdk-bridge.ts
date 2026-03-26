/**
 * Bridge module for the Geyed SDK.
 *
 * The SDK package (`@geyed/sdk`) is not installed as an npm dependency of the
 * dashboard app. This module provides a typed abstraction so the onboarding
 * provider can call SDK methods without a hard import. When the SDK is
 * eventually linked (e.g. via npm workspaces), swap the implementation below
 * for a direct re-export.
 */

// ---------- Types matching SDK's public API ----------

export interface SdkTourDef {
  tourId: number;
  tourName: string;
  versionId: number;
  urlPattern: string | null;
  triggerType: "auto" | "click" | "external";
  triggerSelector: string | null;
  isRepeatable: boolean;
  themeConfig: string | null;
  transitionPreset: string | null;
  steps: {
    id: number;
    order: number;
    title: string;
    content: string;
    targetSelector: string;
    placement: "top" | "bottom" | "left" | "right";
    transitionPreset: string | null;
  }[];
}

export type SdkEventType =
  | "tour_started"
  | "tour_completed"
  | "tour_dismissed"
  | "step_viewed";

export interface SdkTourEvent {
  tourId: number;
  tourName: string;
}

export type SdkEventCallback = (data: SdkTourEvent) => void;

export interface GeyedSdk {
  init: (config: { tours?: SdkTourDef[]; debug?: boolean }) => void;
  startTour: (tourId: number) => Promise<void>;
  stop: () => void;
  destroy: () => void;
  on: (event: SdkEventType, cb: SdkEventCallback) => void;
  off: (event: SdkEventType, cb: SdkEventCallback) => void;
}

// ---------- Runtime resolution ----------

let _sdk: GeyedSdk | null = null;

function noop() {}
const noopSdk: GeyedSdk = {
  init: noop,
  startTour: async () => {},
  stop: noop,
  destroy: noop,
  on: noop,
  off: noop,
};

/**
 * Lazily resolve the SDK. Tries `@geyed/sdk` first (available when the
 * package is linked via workspaces or installed). Falls back to a no-op
 * implementation so the dashboard can run without the SDK being present.
 */
export function getSdk(): GeyedSdk {
  if (_sdk) return _sdk;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@geyed/sdk");
    _sdk = mod as GeyedSdk;
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[onboarding] @geyed/sdk not found – onboarding tours will be inert. " +
          "Link the SDK package to enable interactive tours.",
      );
    }
    _sdk = noopSdk;
  }

  return _sdk;
}
