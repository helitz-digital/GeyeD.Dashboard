import type { ThemeConfig, TransitionPreset } from "@/lib/api/types";

export interface ThemeColors {
  bg: string;
  text: string;
  primary: string;
}

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

export const THEME_PRESETS: { id: ThemeConfig["preset"]; name: string; colors: ThemeColors }[] = [
  { id: "light", name: "Light", colors: { bg: "#ffffff", text: "#1a1a1a", primary: "#2563eb" } },
  { id: "dark", name: "Dark", colors: { bg: "#1e1e2e", text: "#e0e0e0", primary: "#6366f1" } },
  { id: "blue", name: "Blue", colors: { bg: "#1e3a5f", text: "#ffffff", primary: "#38bdf8" } },
  { id: "custom", name: "Custom", colors: { bg: "#ffffff", text: "#1a1a1a", primary: "#2563eb" } },
];

export const TRANSITION_PRESETS: { id: TransitionPreset; name: string; description: string }[] = [
  { id: "smooth", name: "Smooth", description: "Gentle ease-out motion" },
  { id: "snappy", name: "Snappy", description: "Fast, bouncy pop-in" },
  { id: "fade", name: "Fade", description: "Simple opacity crossfade" },
  { id: "slide", name: "Slide", description: "Directional slide with fade" },
  { id: "none", name: "None", description: "No animation" },
];

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

export function parseThemeConfig(json: string | null): ThemeConfig {
  if (!json) return { preset: "light" };
  try {
    return JSON.parse(json) as ThemeConfig;
  } catch {
    return { preset: "light" };
  }
}

/** Resolve a ThemeConfig (or raw JSON string) to concrete CSS colors. */
export function resolveThemeColors(configOrJson: ThemeConfig | string | null): ThemeColors {
  const config = typeof configOrJson === "string" || configOrJson === null
    ? parseThemeConfig(configOrJson)
    : configOrJson;

  if (config.preset === "custom") {
    return {
      bg: config.backgroundColor || "#ffffff",
      text: config.textColor || "#1a1a1a",
      primary: config.primaryColor || "#2563eb",
    };
  }

  return THEME_PRESETS.find((p) => p.id === config.preset)?.colors ?? THEME_PRESETS[0].colors;
}

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
