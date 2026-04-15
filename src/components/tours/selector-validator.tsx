"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface SelectorValidatorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  environmentUrl?: string;
}

interface SelectorDebugResult {
  matched: boolean;
  reason?: string;
  candidateSelectors?: string[];
}

export function SelectorValidator({
  value,
  onChange,
  disabled = false,
  environmentUrl,
}: SelectorValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<SelectorDebugResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous result when value changes
    setResult(null);

    if (!value || !environmentUrl) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await apiClient<SelectorDebugResult>(
          "/api/v1/sdk/selector-debug",
          {
            method: "POST",
            body: JSON.stringify({
              selector: value,
              url: environmentUrl,
              candidateSelectors: [],
            }),
          }
        );
        setResult(res);
      } catch {
        setResult({ matched: false, reason: "Validation request failed" });
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, environmentUrl]);

  return (
    <div className="space-y-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#my-element"
        disabled={disabled}
        aria-label="CSS selector"
        aria-invalid={result ? !result.matched : undefined}
        className="bg-muted border border-border rounded font-mono text-sm"
      />

      {/* Status indicators */}
      {!environmentUrl && value && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-500">
          <AlertTriangle className="size-3.5" />
          <span>Select an environment to validate selectors</span>
        </div>
      )}

      {isValidating && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Validating selector...</span>
        </div>
      )}

      {!isValidating && result && (
        <>
          {result.matched ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
              <CheckCircle2 className="size-3.5" />
              <span>Selector valid</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-destructive">
                <XCircle className="size-3.5" />
                <span>{result.reason || "Selector not found"}</span>
              </div>

              {result.candidateSelectors &&
                result.candidateSelectors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">
                      Did you mean:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {result.candidateSelectors.map((candidate) => (
                        <button
                          key={candidate}
                          type="button"
                          onClick={() => onChange(candidate)}
                          disabled={disabled}
                          className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                        >
                          {candidate}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
