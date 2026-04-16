"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";
import type { StepRequest } from "@/lib/api/types";
import type { ResolvedTheme } from "@/lib/theme";

interface StepPreviewProps {
  step: StepRequest;
  stepIndex: number;
  totalSteps: number;
  resolvedTheme: ResolvedTheme;
}

function ArrowIndicator({ placement, bgColor }: { placement: string; bgColor: string }) {
  const base = "absolute size-2.5 rotate-45";

  const p = placement.toLowerCase();
  const positionClass =
    p === "top"
      ? "-bottom-1.5 left-1/2 -translate-x-1/2"
      : p === "bottom"
        ? "-top-1.5 left-1/2 -translate-x-1/2"
        : p === "left"
          ? "-right-1.5 top-1/2 -translate-y-1/2"
          : p === "right"
            ? "-left-1.5 top-1/2 -translate-y-1/2"
            : "";

  if (!positionClass) return null;

  return (
    <span
      className={`${base} ${positionClass}`}
      style={{ backgroundColor: bgColor }}
    />
  );
}

export function StepPreview({ step, stepIndex, totalSteps, resolvedTheme }: StepPreviewProps) {
  const sanitizedContent = useMemo(
    () => (typeof window !== "undefined" && step.content ? DOMPurify.sanitize(step.content) : ""),
    [step.content],
  );

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
}
