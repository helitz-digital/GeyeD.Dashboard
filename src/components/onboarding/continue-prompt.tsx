"use client";

import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContinuePromptProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function ContinuePrompt({ onContinue, onSkip }: ContinuePromptProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-lg">
      <Button size="sm" onClick={onContinue} className="gap-1.5">
        Continue setup
        <ArrowRight className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onSkip}
        className="text-muted-foreground"
      >
        <X className="size-3.5" />
        <span className="sr-only">Skip onboarding</span>
      </Button>
    </div>
  );
}
