# Theme Preview Animation & SDK Color Alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the dashboard's tooltip preview colors with the SDK's resolved theme and add animated transition previews when users select a transition style.

**Architecture:** Add `ResolvedTheme` type and full color maps to `src/lib/theme.ts` (mirroring `SDK/src/rendering/styles.ts`). Add `TRANSITION_ENTER_DEFS` (mirroring `SDK/src/rendering/transitions.ts`). Update `ThemeEditor` and `StepPreview` to use resolved colors and animate on transition change.

**Tech Stack:** React, TypeScript, CSS @keyframes, Next.js

---

### Task 1: Add `ResolvedTheme` type and preset map to `src/lib/theme.ts`

**Files:**
- Modify: `src/lib/theme.ts:1-48`

- [ ] **Step 1: Add `ResolvedTheme` interface and `RESOLVED_THEMES` map**

Add after the existing `ThemeColors` interface (line 7):

```typescript
// Source of truth: SDK/src/rendering/styles.ts — see #27 for shared package plan
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

const RESOLVED_THEMES: Record<string, ResolvedTheme> = {
  light: {
    bgColor: '#ffffff',
    textColor: '#1a1a1a',
    titleColor: '#111',
    contentColor: '#555',
    primaryBtnBg: '#2563eb',
    primaryBtnHoverBg: '#1d4ed8',
    secondaryBtnBg: '#f1f5f9',
    secondaryBtnText: '#475569',
    secondaryBtnHoverBg: '#e2e8f0',
    closeBtnColor: '#999',
    closeBtnHoverBg: '#f1f5f9',
    progressColor: '#999',
  },
  dark: {
    bgColor: '#1e1e2e',
    textColor: '#e0e0e0',
    titleColor: '#f0f0f0',
    contentColor: '#b0b0b0',
    primaryBtnBg: '#6366f1',
    primaryBtnHoverBg: '#4f46e5',
    secondaryBtnBg: '#2d2d3f',
    secondaryBtnText: '#b0b0b0',
    secondaryBtnHoverBg: '#3d3d4f',
    closeBtnColor: '#888',
    closeBtnHoverBg: '#2d2d3f',
    progressColor: '#888',
  },
  blue: {
    bgColor: '#1e3a5f',
    textColor: '#ffffff',
    titleColor: '#ffffff',
    contentColor: '#cbd5e1',
    primaryBtnBg: '#38bdf8',
    primaryBtnHoverBg: '#0ea5e9',
    secondaryBtnBg: '#2a4a6f',
    secondaryBtnText: '#cbd5e1',
    secondaryBtnHoverBg: '#3a5a7f',
    closeBtnColor: '#94a3b8',
    closeBtnHoverBg: '#2a4a6f',
    progressColor: '#94a3b8',
  },
};
```

- [ ] **Step 2: Add `resolveFullTheme()` function**

Add after the existing `resolveThemeColors` function (after line 48):

```typescript
/** Resolve a ThemeConfig to the full SDK-aligned color set. */
export function resolveFullTheme(configOrJson: ThemeConfig | string | null): ResolvedTheme {
  const config = typeof configOrJson === "string" || configOrJson === null
    ? parseThemeConfig(configOrJson)
    : configOrJson;

  if (config.preset !== "custom" && RESOLVED_THEMES[config.preset]) {
    return RESOLVED_THEMES[config.preset];
  }

  if (config.preset === "custom") {
    const primary = config.primaryColor || "#2563eb";
    const bg = config.backgroundColor || "#ffffff";
    const text = config.textColor || "#1a1a1a";
    return {
      bgColor: bg,
      textColor: text,
      titleColor: text,
      contentColor: text,
      primaryBtnBg: primary,
      primaryBtnHoverBg: primary,
      secondaryBtnBg: "#f1f5f9",
      secondaryBtnText: "#475569",
      secondaryBtnHoverBg: "#e2e8f0",
      closeBtnColor: "#999",
      closeBtnHoverBg: "#f1f5f9",
      progressColor: "#999",
    };
  }

  return RESOLVED_THEMES.light;
}
```

- [ ] **Step 3: Verify the app builds**

Run: `npx next build` or the project's build/typecheck command.
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/theme.ts
git commit -m "feat(theme): add ResolvedTheme type and SDK-aligned color presets"
```

---

### Task 2: Add transition enter definitions to `src/lib/theme.ts`

**Files:**
- Modify: `src/lib/theme.ts`

- [ ] **Step 1: Add `TRANSITION_ENTER_DEFS` map**

Add after the `TRANSITION_PRESETS` array (after line 22):

```typescript
// Source of truth: SDK/src/rendering/transitions.ts — see #27 for shared package plan
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
  snappy: {
    keyframes: 'from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); }',
    duration: 250,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  fade: {
    keyframes: 'from { opacity: 0; } to { opacity: 1; }',
    duration: 500,
    easing: 'ease',
  },
  slide: {
    keyframes: 'from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); }',
    duration: 450,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  none: {
    keyframes: 'from { opacity: 1; } to { opacity: 1; }',
    duration: 0,
    easing: 'linear',
  },
};
```

- [ ] **Step 2: Verify the app builds**

Run: `npx next build` or the project's typecheck command.
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme.ts
git commit -m "feat(theme): add transition enter animation definitions from SDK"
```

---

### Task 3: Update `ThemeEditor` preview to use `ResolvedTheme` colors

**Files:**
- Modify: `src/components/tours/theme-editor.tsx:1-284`

- [ ] **Step 1: Update imports and resolve full theme**

Replace the existing import line (line 8):

```typescript
import { THEME_PRESETS, TRANSITION_PRESETS, parseThemeConfig, resolveFullTheme } from "@/lib/theme";
```

Add a new import for `ResolvedTheme`:

```typescript
import type { ResolvedTheme } from "@/lib/theme";
```

- [ ] **Step 2: Replace `activeColors` with `resolvedTheme`**

Replace the `activeColors` computation (lines 39-41) with:

```typescript
  const resolvedTheme: ResolvedTheme = preset === 'custom'
    ? resolveFullTheme({ preset: 'custom', primaryColor, backgroundColor, textColor })
    : resolveFullTheme({ preset });
```

- [ ] **Step 3: Update the live preview section to use `resolvedTheme`**

Replace the live preview tooltip div (lines 219-272) with:

```tsx
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/50 p-8">
          <div
            className="rounded-lg shadow-lg"
            style={{
              backgroundColor: resolvedTheme.bgColor,
              padding: '16px 20px',
              maxWidth: '320px',
              minWidth: '240px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: resolvedTheme.titleColor }}>
              Welcome to our app
            </div>
            <div style={{ color: resolvedTheme.contentColor, fontSize: 14, marginBottom: 14 }}>
              This is a preview of your tooltip theme. The colors shown here will be used for all tour steps.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: resolvedTheme.progressColor }}>1 of 3</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  disabled
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    border: 'none',
                    backgroundColor: resolvedTheme.secondaryBtnBg,
                    color: resolvedTheme.secondaryBtnText,
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    border: 'none',
                    backgroundColor: resolvedTheme.primaryBtnBg,
                    color: '#ffffff',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
```

Note: removed the `opacity` hacks — each element now uses its own dedicated color from the resolved theme.

- [ ] **Step 4: Update the mini tooltip previews in preset selection**

The mini previews in the preset grid (lines 85-103) also use `p.colors.{bg,text,primary}`. These are fine as-is since they're just tiny color swatches — they don't need the full resolved theme. No change needed here.

- [ ] **Step 5: Verify the app builds and the preview renders correctly**

Run the dev server and navigate to the tours page for any app. Confirm:
- Light preset: title is slightly darker than content text, Back button has distinct slate color
- Dark preset: title is brighter (#f0f0f0) than content (#b0b0b0)
- Blue preset: content is slate-gray (#cbd5e1), not white
- Custom preset: colors match picker selections

- [ ] **Step 6: Commit**

```bash
git add src/components/tours/theme-editor.tsx
git commit -m "feat(theme-editor): use SDK-aligned resolved theme colors in preview"
```

---

### Task 4: Add transition animation replay to `ThemeEditor`

**Files:**
- Modify: `src/components/tours/theme-editor.tsx`

- [ ] **Step 1: Add imports for animation support**

Update the React import (line 3) to include `useCallback`:

```typescript
import { useState, useRef, useEffect, useCallback } from "react";
```

Update the lucide import (line 7) to include `RotateCcw`:

```typescript
import { Loader2, Check, RotateCcw } from "lucide-react";
```

Update the theme import (line 8) to include `TRANSITION_ENTER_DEFS`:

```typescript
import { THEME_PRESETS, TRANSITION_PRESETS, TRANSITION_ENTER_DEFS, parseThemeConfig, resolveFullTheme } from "@/lib/theme";
```

- [ ] **Step 2: Add `animKey` state and replay handler**

Add after the `transitionPreset` state (after line 23):

```typescript
  const [animKey, setAnimKey] = useState(0);

  const replayAnimation = useCallback(() => {
    setAnimKey((k) => k + 1);
  }, []);
```

- [ ] **Step 3: Trigger animation on transition preset change**

Update the `setTransitionPreset` call in the transition button `onClick` (line 206). Replace:

```typescript
            onClick={() => setTransitionPreset(t.id)}
```

With:

```typescript
            onClick={() => {
              setTransitionPreset(t.id);
              setAnimKey((k) => k + 1);
            }}
```

Also update the sync effect (lines 26-37) — add `setAnimKey` bump when config changes from external source. After `setTransitionPreset(next.transitionPreset || 'smooth');` add:

```typescript
      setAnimKey((k) => k + 1);
```

- [ ] **Step 4: Add replay button next to the Preview label**

Replace the Preview label section (lines 215-217) with:

```tsx
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Preview
        </Label>
        {transitionPreset !== 'none' && (
          <button
            type="button"
            onClick={replayAnimation}
            aria-label="Replay transition animation"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3" />
            Replay
          </button>
        )}
```

Wrap the label and button in a flex container:

```tsx
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Preview
        </Label>
        {transitionPreset !== 'none' && (
          <button
            type="button"
            onClick={replayAnimation}
            aria-label="Replay transition animation"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3" />
            Replay
          </button>
        )}
      </div>
```

- [ ] **Step 5: Add animation style injection and `key` to preview tooltip**

Get the current transition def and inject a style block. Add just before the preview container `<div>`:

```tsx
        {transitionPreset !== 'none' && (
          <style>{`
            @keyframes geyed-preview-enter {
              ${TRANSITION_ENTER_DEFS[transitionPreset].keyframes}
            }
          `}</style>
        )}
```

Add `key={animKey}` and animation style to the tooltip div. The outer preview container div (the one with `bg-muted/50 p-8`) stays as-is. The inner tooltip div gets the key and animation:

```tsx
          <div
            key={animKey}
            className="rounded-lg shadow-lg"
            style={{
              backgroundColor: resolvedTheme.bgColor,
              padding: '16px 20px',
              maxWidth: '320px',
              minWidth: '240px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              ...(transitionPreset !== 'none' ? {
                animation: `geyed-preview-enter ${TRANSITION_ENTER_DEFS[transitionPreset].duration}ms ${TRANSITION_ENTER_DEFS[transitionPreset].easing} forwards`,
              } : {}),
            }}
          >
```

- [ ] **Step 6: Test in browser**

Run the dev server and navigate to the tours page. Verify:
- Clicking "Smooth" → tooltip fades in sliding up from below (600ms)
- Clicking "Snappy" → tooltip pops in with a bounce scale (250ms)
- Clicking "Fade" → tooltip fades in (500ms)
- Clicking "Slide" → tooltip slides in from the left (450ms)
- Clicking "None" → no animation, no replay button shown
- Clicking "Replay" → re-triggers the current animation
- Re-clicking the already-selected preset → animation replays

- [ ] **Step 7: Commit**

```bash
git add src/components/tours/theme-editor.tsx
git commit -m "feat(theme-editor): animate preview tooltip on transition preset change"
```

---

### Task 5: Update `StepPreview` to use `ResolvedTheme` colors

**Files:**
- Modify: `src/components/tours/step-preview.tsx:1-127`
- Modify: `src/app/(dashboard)/apps/[appId]/tours/[tourId]/page.tsx:14,64-66`

- [ ] **Step 1: Update `StepPreview` to accept `ResolvedTheme`**

Replace the import and interface (lines 6-13):

```typescript
import type { ResolvedTheme } from "@/lib/theme";

interface StepPreviewProps {
  step: StepRequest;
  stepIndex: number;
  totalSteps: number;
  resolvedTheme: ResolvedTheme;
}
```

- [ ] **Step 2: Update `StepPreview` component body to use `resolvedTheme`**

Replace the destructuring and `backBg` (lines 41-42):

```typescript
export function StepPreview({ step, stepIndex, totalSteps, resolvedTheme }: StepPreviewProps) {
```

Update the rendered tooltip — replace the entire return (lines 49-125):

```tsx
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Tooltip Preview
      </span>
      <div className="flex items-center justify-center rounded-lg border border-border bg-muted/50 dark:bg-[oklch(0.35_0_0)] p-8">
        <div
          className="relative rounded-lg shadow-lg"
          style={{
            backgroundColor: resolvedTheme.bgColor,
            padding: "16px 20px",
            maxWidth: "320px",
            minWidth: "240px",
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <ArrowIndicator placement={step.placement} bgColor={resolvedTheme.bgColor} />

          {/* Title */}
          <div style={{ fontWeight: 600, fontSize: 14, color: resolvedTheme.titleColor }}>
            {step.title || "Untitled Step"}
          </div>

          {/* Content */}
          {sanitizedContent && (
            <div
              style={{ color: resolvedTheme.contentColor, fontSize: 13, marginTop: 6 }}
              className="[&_p]:my-0.5 [&_ul]:my-0.5 [&_ul]:list-disc [&_ul]:pl-4 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <span style={{ fontSize: 11, color: resolvedTheme.progressColor }}>
              {stepIndex + 1} of {totalSteps}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {stepIndex > 0 && (
                <button
                  type="button"
                  disabled
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    border: "none",
                    backgroundColor: resolvedTheme.secondaryBtnBg,
                    color: resolvedTheme.secondaryBtnText,
                  }}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                disabled
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  border: "none",
                  backgroundColor: resolvedTheme.primaryBtnBg,
                  color: "#ffffff",
                }}
              >
                {stepIndex === totalSteps - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 3: Update the tour detail page to pass `resolvedTheme`**

In `src/app/(dashboard)/apps/[appId]/tours/[tourId]/page.tsx`:

Update the import (line 14):

```typescript
import { resolveFullTheme } from "@/lib/theme";
```

Update the memo (lines 64-67):

```typescript
  const resolvedTheme = useMemo(
    () => resolveFullTheme(app?.themeConfig ?? null),
    [app?.themeConfig]
  );
```

Find where `<StepPreview` is rendered and change `themeColors={themeColors}` to `resolvedTheme={resolvedTheme}`.

- [ ] **Step 4: Remove unused `ThemeColors` exports if no longer referenced**

After making the changes, check if `ThemeColors` and `resolveThemeColors` are still used anywhere:

```bash
grep -r "ThemeColors\|resolveThemeColors" src/ --include="*.ts" --include="*.tsx"
```

If only `src/lib/theme.ts` references them, remove the `ThemeColors` interface, `resolveThemeColors` function, and the `colors` property from `THEME_PRESETS`. If other files still reference them, keep them.

- [ ] **Step 5: Verify build and test in browser**

Run the dev server, open a tour detail page, and confirm:
- Step preview tooltip uses the correct SDK-aligned colors
- Arrow indicator still renders correctly
- All three presets render with distinct title/content/secondary colors

- [ ] **Step 6: Commit**

```bash
git add src/components/tours/step-preview.tsx src/app/\(dashboard\)/apps/\[appId\]/tours/\[tourId\]/page.tsx src/lib/theme.ts
git commit -m "feat(step-preview): use SDK-aligned resolved theme colors"
```

---

### Task 6: Final verification and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full build**

```bash
npx next build
```

Expected: Clean build, no type errors.

- [ ] **Step 2: Manual smoke test**

Open the dashboard, navigate to the tours page:
1. Theme editor: switch between Light/Dark/Blue/Custom presets — preview colors should match SDK
2. Click each transition preset — preview tooltip should animate in with the correct style
3. Click "Replay" — animation replays
4. Select "None" — no animation, no replay button
5. Open a tour detail page — step preview should also use correct SDK-aligned colors

- [ ] **Step 3: Commit any final fixes**

Only if needed from smoke test findings.
