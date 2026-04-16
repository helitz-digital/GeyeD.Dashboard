# Theme Preview Animation & SDK Color Alignment

**Issue:** helitz-digital/GeyeD.Dashboard#21
**Related:** helitz-digital/GeyeD.Dashboard#27 (future shared package)
**Date:** 2026-04-16

## Problem

The theme editor preview has two issues:

1. **Colors drift from SDK** — The dashboard preview uses 3 base colors (bg, text, primary) with opacity hacks to approximate secondary elements. The SDK resolves 12 distinct color properties per preset. The preview doesn't match what users actually see in production.

2. **No transition preview** — Selecting a transition style (smooth, snappy, fade, slide, none) shows no visual feedback. Users can't see what the animation looks like until they publish and test live.

## Design

### 1. Align preview colors with SDK

**File: `src/lib/theme.ts`**

Add a `ResolvedTheme` interface and preset map matching the SDK's `styles.ts`:

```typescript
export interface ResolvedTheme {
  bgColor: string;
  textColor: string;
  titleColor: string;
  contentColor: string;
  primaryBtnBg: string;
  primaryBtnHoverBg: string;
  secondaryBtnBg: string;
  secondaryBtnText: string;
  secondaryBtnHoverBg: string;
  closeBtnColor: string;
  closeBtnHoverBg: string;
  progressColor: string;
}
```

Add `RESOLVED_THEMES` — a `Record<string, ResolvedTheme>` with light/dark/blue presets, values copied from `SDK/src/rendering/styles.ts`. Add a `resolveFullTheme(config)` function that returns a `ResolvedTheme` for any `ThemeConfig` (preset or custom).

Add a comment: `// Source of truth: SDK/src/rendering/styles.ts — see #27 for shared package plan`.

**File: `src/components/tours/theme-editor.tsx`**

Update the live preview section to use `ResolvedTheme` properties instead of `activeColors.{bg,text,primary}` with opacity:
- Title uses `titleColor`
- Content uses `contentColor`
- Back button uses `secondaryBtnBg` / `secondaryBtnText`
- Next button uses `primaryBtnBg`
- Step counter uses `progressColor`

**File: `src/components/tours/step-preview.tsx`**

Update `ThemeColors` usage to accept `ResolvedTheme` and apply the same distinct colors. The existing `ThemeColors` type can remain as an alias or be replaced — whichever causes less churn upstream.

### 2. Add transition preview animation

**File: `src/lib/theme.ts`**

Add a `TRANSITION_ENTER_DEFS` map containing only the tooltip enter animation per preset:

```typescript
export const TRANSITION_ENTER_DEFS: Record<TransitionPreset, {
  keyframes: string;
  duration: number;
  easing: string;
}> = {
  smooth: {
    keyframes: 'from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }',
    duration: 600,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  snappy: { /* ... from SDK */ },
  fade: { /* ... from SDK */ },
  slide: { /* ... from SDK */ },
  none: { duration: 0, easing: 'linear', keyframes: 'from { opacity: 1; } to { opacity: 1; }' },
};
```

Comment: `// Source of truth: SDK/src/rendering/transitions.ts — see #27 for shared package plan`

**File: `src/components/tours/theme-editor.tsx`**

Add animation replay behavior:

- New state: `const [animKey, setAnimKey] = useState(0)`
- When `transitionPreset` changes, increment `animKey`
- Add a "Replay" button (lucide `RotateCcw` icon) next to the "Preview" label that also increments `animKey`
- The preview tooltip div gets `key={animKey}` to force remount
- Inject a `<style>` block defining `@keyframes geyed-preview-enter` from the selected preset's `TRANSITION_ENTER_DEFS`
- Apply the animation via inline style: `animation: geyed-preview-enter ${duration}ms ${easing} forwards`

For `none` preset, skip the animation entirely (no remount needed).

### 3. Files changed

| File | Change |
|------|--------|
| `src/lib/theme.ts` | Add `ResolvedTheme`, `RESOLVED_THEMES`, `TRANSITION_ENTER_DEFS`, `resolveFullTheme()` |
| `src/components/tours/theme-editor.tsx` | Use `ResolvedTheme` colors, add animation replay with `animKey` |
| `src/components/tours/step-preview.tsx` | Use `ResolvedTheme` colors instead of `ThemeColors` with opacity |

### 4. Out of scope

- Shared `@geyed/theme` package extraction (tracked in #27)
- Exit animations (not useful for a static preview)
- Highlight/overlay animation preview (no meaningful way to show this in a tooltip-only preview)
- Changes to the SDK itself
