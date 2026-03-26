import type { ThemeConfig, TransitionPreset } from "@/lib/api/types";

export interface ThemeColors {
  bg: string;
  text: string;
  primary: string;
}

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
