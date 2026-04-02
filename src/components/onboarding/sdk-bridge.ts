/**
 * Bridge module for the Geyed SDK.
 *
 * Re-exports the SDK's public API with local type aliases so the onboarding
 * provider doesn't need to import from `@geyed/sdk` directly everywhere.
 */

import * as sdk from "@geyed/sdk";
import type {
  GeyedConfig,
  GeyedEventType,
  GeyedEventCallback,
  GeyedTourEvent,
  SdkTour,
} from "@geyed/sdk";

// ---------- Re-exported types ----------

export type SdkTourDef = SdkTour;
export type SdkEventType = GeyedEventType;
export type SdkTourEvent = GeyedTourEvent;
export type SdkEventCallback = GeyedEventCallback;

export interface GeyedSdk {
  init: (config: GeyedConfig) => void;
  startTour: (tourId: number) => Promise<void>;
  stop: () => void;
  destroy: () => void;
  on: (event: GeyedEventType, cb: GeyedEventCallback) => void;
  off: (event: GeyedEventType, cb: GeyedEventCallback) => void;
}

// ---------- SDK accessor ----------

/**
 * Returns the SDK module. Now that `@geyed/sdk` is linked, this is a direct
 * re-export rather than a lazy require with fallback.
 */
export function getSdk(): GeyedSdk {
  return sdk;
}
