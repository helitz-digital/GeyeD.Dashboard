"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { THEME_PRESETS, TRANSITION_PRESETS, parseThemeConfig } from "@/lib/theme";
import type { ThemeConfig, TransitionPreset } from "@/lib/api/types";

interface ThemeEditorProps {
  currentThemeConfig: string | null;
  onSave: (themeConfig: string | null) => Promise<void>;
  isSaving: boolean;
}

export function ThemeEditor({ currentThemeConfig, onSave, isSaving }: ThemeEditorProps) {
  const parsed = parseThemeConfig(currentThemeConfig);
  const [preset, setPreset] = useState<ThemeConfig['preset']>(parsed.preset);
  const [primaryColor, setPrimaryColor] = useState(parsed.primaryColor || '#2563eb');
  const [backgroundColor, setBackgroundColor] = useState(parsed.backgroundColor || '#ffffff');
  const [textColor, setTextColor] = useState(parsed.textColor || '#1a1a1a');
  const [transitionPreset, setTransitionPreset] = useState<TransitionPreset>(parsed.transitionPreset || 'smooth');

  // Sync local state when the persisted config changes (e.g. after query refetch)
  const prevConfig = useRef(currentThemeConfig);
  useEffect(() => {
    if (currentThemeConfig !== prevConfig.current) {
      prevConfig.current = currentThemeConfig;
      const next = parseThemeConfig(currentThemeConfig);
      setPreset(next.preset);
      setPrimaryColor(next.primaryColor || '#2563eb');
      setBackgroundColor(next.backgroundColor || '#ffffff');
      setTextColor(next.textColor || '#1a1a1a');
      setTransitionPreset(next.transitionPreset || 'smooth');
    }
  }, [currentThemeConfig]);

  const activeColors = preset === 'custom'
    ? { bg: backgroundColor, text: textColor, primary: primaryColor }
    : THEME_PRESETS.find(p => p.id === preset)?.colors || THEME_PRESETS[0].colors;

  const handleSave = async () => {
    const config: ThemeConfig = {
      preset,
      ...(preset === 'custom' ? { primaryColor, backgroundColor, textColor } : {}),
      transitionPreset,
    };
    await onSave(JSON.stringify(config));
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Tooltip Theme
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose a preset or customize the tooltip appearance for your tours.
        </p>
      </div>

      {/* Preset selection */}
      <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label="Theme preset">
        {THEME_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={preset === p.id}
            aria-label={`${p.name} theme preset`}
            onClick={() => setPreset(p.id)}
            className={`relative rounded-lg border-2 p-3 text-left transition-colors ${
              preset === p.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            {preset === p.id && (
              <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
                <Check className="size-2.5 text-primary-foreground" />
              </div>
            )}
            {/* Mini tooltip preview */}
            <div
              className="mb-2 rounded-md p-2 shadow-sm"
              style={{ backgroundColor: p.colors.bg }}
            >
              <div className="text-[8px] font-semibold" style={{ color: p.colors.text }}>
                Title
              </div>
              <div className="mt-0.5 text-[7px]" style={{ color: p.colors.text, opacity: 0.7 }}>
                Content here
              </div>
              <div className="mt-1 flex justify-end">
                <div
                  className="rounded px-1.5 py-0.5 text-[7px] text-white font-medium"
                  style={{ backgroundColor: p.colors.primary }}
                >
                  Next
                </div>
              </div>
            </div>
            <p className="text-xs font-medium text-foreground">{p.name}</p>
          </button>
        ))}
      </div>

      {/* Custom color inputs */}
      {preset === 'custom' && (
        <div className="grid grid-cols-3 gap-4 rounded-lg border border-border p-4">
          <div className="space-y-2">
            <Label htmlFor="theme-primary-color" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Primary Color
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="theme-primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                aria-label="Primary color picker"
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                aria-label="Primary color hex value"
                className="h-8 bg-muted font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-background-color" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Background
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="theme-background-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                aria-label="Background color picker"
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                aria-label="Background color hex value"
                className="h-8 bg-muted font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-text-color" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Text Color
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="theme-text-color"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                aria-label="Text color picker"
                className="h-8 w-8 cursor-pointer rounded border border-border"
              />
              <Input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                aria-label="Text color hex value"
                className="h-8 bg-muted font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transition style */}
      <div>
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Transition Style
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose how tooltips animate between steps.
        </p>
      </div>
      <div className="grid grid-cols-5 gap-3" role="radiogroup" aria-label="Transition style">
        {TRANSITION_PRESETS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={transitionPreset === t.id}
            aria-label={`${t.name} transition: ${t.description}`}
            onClick={() => setTransitionPreset(t.id)}
            className={`relative rounded-lg border-2 p-3 text-left transition-colors ${
              transitionPreset === t.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            {transitionPreset === t.id && (
              <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary">
                <Check className="size-2.5 text-primary-foreground" />
              </div>
            )}
            <p className="text-xs font-medium text-foreground">{t.name}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Preview
        </Label>
        <div className="flex items-center justify-center rounded-lg border border-border bg-muted/50 p-8">
          <div
            className="rounded-lg shadow-lg"
            style={{
              backgroundColor: activeColors.bg,
              padding: '16px 20px',
              maxWidth: '320px',
              minWidth: '240px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: activeColors.text }}>
              Welcome to our app
            </div>
            <div style={{ color: activeColors.text, opacity: 0.7, fontSize: 14, marginBottom: 14 }}>
              This is a preview of your tooltip theme. The colors shown here will be used for all tour steps.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: activeColors.text, opacity: 0.5 }}>1 of 3</span>
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
                    backgroundColor: activeColors.bg === '#ffffff' ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
                    color: activeColors.text,
                    opacity: 0.7,
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
                    backgroundColor: activeColors.primary,
                    color: '#ffffff',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Theme'}
        </Button>
      </div>
    </div>
  );
}
