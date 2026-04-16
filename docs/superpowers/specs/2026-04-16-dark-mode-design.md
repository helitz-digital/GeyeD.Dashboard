# Dark Mode — Design Spec

**Issue:** #16 — [MEDIUM] Dark mode
**Date:** 2026-04-16
**Approach:** Mirror the marketing site's dark/light mode toggle

## Requirements

1. Follow the marketing site's dark/light mode toggle pattern
2. Respect the user's system preference for dark/light mode (via `prefers-color-scheme`)
3. Persist the user's explicit choice across sessions

## Existing Infrastructure

The dashboard already has most of the groundwork:

- **CSS variables** in `src/app/globals.css` — complete light (`:root`) and dark (`.dark`) token sets using OKLch color space (~40 custom properties each)
- **Tailwind 4 dark variant** — `@custom-variant dark (&:is(.dark *))` defined in `globals.css`
- **`next-themes` v0.4.6** — installed, currently used only by Sonner toasts (`src/components/ui/sonner.tsx`)
- **31 `dark:` Tailwind classes** — already present across components (billing badges, logo, UI primitives)
- **Logo component** — `src/components/shared/logo.tsx` already swaps light/dark images via `dark:hidden` / `hidden dark:block`

## Changes

### 1. ThemeProvider (`src/providers/theme-provider.tsx`)

A thin `"use client"` wrapper around `NextThemesProvider` from `next-themes`:

- `attribute="class"` — sets `.dark` class on `<html>`, matching the existing CSS custom variant
- `defaultTheme="system"` — uses OS preference on first visit
- `enableSystem` — reacts to OS preference changes in real-time
- `disableTransitionOnChange` — prevents flash of intermediate styling during toggle

### 2. Root Layout Update (`src/app/layout.tsx`)

- Add `suppressHydrationWarning` to `<html>` tag (required by `next-themes` — it modifies the class attribute before React hydrates)
- Wrap existing provider tree with `<ThemeProvider>` as the outermost provider

### 3. ThemeToggle Component (`src/components/layout/theme-toggle.tsx`)

- Uses `useTheme()` hook from `next-themes` for `resolvedTheme` and `setTheme`
- Hydration guard: `useState(false)` + `useEffect(() => setMounted(true), [])` — renders an empty placeholder button until mounted to avoid SSR icon mismatch
- Toggles between `"light"` and `"dark"` on click
- Displays Sun icon (from `lucide-react`) when dark, Moon icon when light
- Styled to match existing topbar icon buttons: `size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground`
- `aria-label="Toggle theme"` for accessibility

### 4. Topbar Integration (`src/components/layout/topbar.tsx`)

- Import and render `<ThemeToggle />` in the right-side actions `<div>`, before `<NotificationBell />`
- Layout: `[Breadcrumbs] ... [ThemeToggle] [NotificationBell] [Help] [Avatar]`

### 5. No CSS Changes

`globals.css` already defines complete light/dark variable sets and the Tailwind dark variant. No modifications needed.

## Out of Scope

- Settings page theme preference (can be added later)
- Three-way toggle (light/dark/system) — clicking toggles between light and dark; system preference is only the initial default
- Additional dark mode color tuning — existing CSS variables are assumed correct

## Persistence

Handled automatically by `next-themes` via `localStorage` (key: `theme`). No custom persistence code needed.
