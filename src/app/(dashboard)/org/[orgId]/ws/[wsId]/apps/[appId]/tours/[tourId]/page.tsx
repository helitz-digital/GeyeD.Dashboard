"use client";

import { useTour, useDraft, useSaveDraft, usePublish, useUnpublish, useApp } from "@/lib/api/hooks";
import { useOnboarding, ONBOARDING_TOUR_IDS } from "@/providers/onboarding-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StepList } from "@/components/tours/step-list";
import { RichTextEditor } from "@/components/tours/rich-text-editor";
import { StepPreview } from "@/components/tours/step-preview";
import { SelectorValidator } from "@/components/tours/selector-validator";
import { resolveThemeColors } from "@/lib/theme";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Plus, Loader2, Trash2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { StepRequest, TriggerType, TransitionPreset } from "@/lib/api/types";
import { TRANSITION_PRESETS } from "@/lib/theme";

function CodeSnippet({ tourId }: { tourId: number }) {
  const [copied, setCopied] = useState(false);
  const snippet = `Geyed.startTour(${tourId})`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
      <code className="flex-1 text-xs font-mono text-foreground">{snippet}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

export default function TourDetailPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const wsId = Number(params.wsId);
  const appId = Number(params.appId);
  const tourId = Number(params.tourId);

  const { data: tour } = useTour(appId, tourId);
  const { data: app } = useApp(wsId, appId);
  const { data: draft } = useDraft(appId, tourId);
  const saveDraft = useSaveDraft(appId, tourId);
  const publish = usePublish(appId, tourId);
  const unpublish = useUnpublish(appId, tourId);
  const { advanceStage, currentStage, startOnboardingTour } = useOnboarding();

  const themeColors = useMemo(
    () => resolveThemeColors(app?.themeConfig ?? null),
    [app?.themeConfig]
  );

  const [steps, setSteps] = useState<StepRequest[]>([]);
  const [urlPattern, setUrlPattern] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [selectedEnvUrl, setSelectedEnvUrl] = useState<string>("");
  const [triggerType, setTriggerType] = useState<TriggerType>("auto");
  const [triggerSelector, setTriggerSelector] = useState("");
  const [isRepeatable, setIsRepeatable] = useState(false);
  const [tourTransitionPreset, setTourTransitionPreset] = useState<string | null>(null);

  // Sync local state when draft data loads or changes
  const loadedDraftId = useRef<number | null>(null);
  useEffect(() => {
    if (draft && draft.id !== loadedDraftId.current) {
      setSteps(draft.steps.map((s, i) => ({
        order: s.order ?? i,
        title: s.title,
        content: s.content,
        targetSelector: s.targetSelector,
        placement: s.placement,
        transitionPreset: s.transitionPreset ?? undefined,
      })));
      setUrlPattern(draft.urlPattern || "");
      setTriggerType((draft.triggerType as TriggerType) || "auto");
      setTriggerSelector(draft.triggerSelector || "");
      setIsRepeatable(draft.isRepeatable ?? false);
      setTourTransitionPreset(draft.transitionPreset);
      setActiveStepIndex(0);
      loadedDraftId.current = draft.id;
    }
  }, [draft]);

  const handleAddStep = () => {
    const newSteps = [...steps, { order: steps.length, title: "", content: "", targetSelector: "", placement: "bottom" }];
    setSteps(newSteps);
    setActiveStepIndex(newSteps.length - 1);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    if (activeStepIndex >= newSteps.length) {
      setActiveStepIndex(Math.max(0, newSteps.length - 1));
    }
  };

  const handleStepChange = (index: number, field: keyof StepRequest, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const buildRequest = () => ({
    urlPattern: urlPattern || undefined,
    triggerType: triggerType,
    triggerSelector: triggerType === "click" ? triggerSelector : undefined,
    isRepeatable: triggerType === "auto" ? false : isRepeatable,
    transitionPreset: tourTransitionPreset ?? undefined,
    steps: steps.map((s, i) => ({ ...s, order: i, transitionPreset: s.transitionPreset || undefined })),
  });

  const handleSave = async () => {
    await saveDraft.mutateAsync(buildRequest());
    toast.success("Draft saved");

    // Advance onboarding when user first saves a tour draft
    if (currentStage === "appCreated") {
      advanceStage("tourCreated");
    }
  };

  const handlePublish = async () => {
    await publish.mutateAsync(buildRequest());
    toast.success("Tour published");

    // Advance onboarding based on current stage
    if (currentStage === "appCreated") {
      advanceStage("tourCreated");
    } else if (currentStage === "tourCreated") {
      advanceStage("sdkInstalled");
    } else if (currentStage === "sdkInstalled") {
      advanceStage("complete");
    }
  };

  const handleUnpublish = async () => {
    await unpublish.mutateAsync();
    toast.success("Tour unpublished");
  };

  // -----------------------------------------------------------------------
  // Trigger onboarding SDK tour when arriving at the right stage
  // -----------------------------------------------------------------------
  const hasTriggeredTour = useRef(false);
  useEffect(() => {
    if (!draft || hasTriggeredTour.current) return;

    if (currentStage === "appCreated") {
      hasTriggeredTour.current = true;
      // Small delay so DOM elements with data-onboarding attributes are rendered
      const timer = setTimeout(() => {
        startOnboardingTour(ONBOARDING_TOUR_IDS.BUILD_TOUR);
      }, 600);
      return () => clearTimeout(timer);
    }
    if (currentStage === "sdkInstalled") {
      hasTriggeredTour.current = true;
      const timer = setTimeout(() => {
        startOnboardingTour(ONBOARDING_TOUR_IDS.PUBLISH);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [draft, currentStage, startOnboardingTour]);

  const activeStep = steps[activeStepIndex];
  const isSaving = saveDraft.isPending;
  const isPublishing = publish.isPending;
  const isUnpublishing = unpublish.isPending;
  const isPublished = tour?.isPublished ?? false;

  // Loading state
  if (!tour || !draft) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading tour...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/org/${orgId}/ws/${params.wsId}/apps/${params.appId}/tours`}
              className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-heading">
                {tour.name}
              </h1>
              {tour.description && (
                <p className="text-sm font-medium text-muted-foreground">
                  {tour.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPublished && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnpublish}
                disabled={isUnpublishing}
                className="text-muted-foreground"
              >
                {isUnpublishing ? "Unpublishing..." : "Unpublish"}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isPublishing}
            >
              {isSaving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              data-onboarding="publish-button"
              size="sm"
              onClick={handlePublish}
              disabled={isSaving || isPublishing}
            >
              {isPublishing && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {isPublishing ? "Publishing..." : "Save & Publish"}
            </Button>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Step sidebar */}
        <aside data-onboarding="step-list" className="flex w-80 flex-col border-r border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Tour Steps
              </span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                {steps.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <StepList
              steps={steps}
              activeStepIndex={activeStepIndex}
              isDraft={true}
              onSelectStep={setActiveStepIndex}
              onAddStep={handleAddStep}
              onReorder={(reordered) => setSteps(reordered)}
            />
          </div>
        </aside>

        {/* Right panel - Configuration form */}
        <main data-onboarding="step-editor" className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-2xl space-y-6 p-6">
            {/* Tour Settings */}
            <div data-onboarding="tour-settings" className="space-y-6">
            {/* URL Pattern */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                URL Pattern
              </Label>
              <Input
                value={urlPattern}
                onChange={e => setUrlPattern(e.target.value)}
                placeholder="/* (matches all pages)"
                className="bg-muted border border-border rounded"
              />
              <p className="text-[10px] text-muted-foreground">
                Use * as wildcard. Example: /dashboard/* matches /dashboard/settings
              </p>
            </div>

            {/* Trigger Type */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Trigger
              </Label>
              <div className="flex gap-1 rounded-md border border-border bg-muted p-1">
                {[
                  { value: "auto" as const, label: "Automatic" },
                  { value: "click" as const, label: "Click Element" },
                  { value: "external" as const, label: "External (Code)" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTriggerType(opt.value);
                      if (opt.value === "auto") {
                        setIsRepeatable(false);
                      }
                    }}
                    className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                      triggerType === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {triggerType === "auto" && "Tour starts automatically when the page matches the URL pattern."}
                {triggerType === "click" && "Tour starts when a user clicks the specified element."}
                {triggerType === "external" && "Tour starts when triggered programmatically via the SDK."}
              </p>

              {/* Click trigger: selector input */}
              {triggerType === "click" && (
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Trigger Element Selector
                  </Label>
                  <SelectorValidator
                    value={triggerSelector}
                    onChange={setTriggerSelector}
                    environmentUrl={selectedEnvUrl || undefined}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    CSS selector of the element that triggers the tour (e.g. #help-btn, .onboarding-trigger)
                  </p>
                </div>
              )}

              {/* External trigger: code snippet */}
              {triggerType === "external" && (
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Code Snippet
                  </Label>
                  <CodeSnippet tourId={tourId} />
                  <p className="text-[10px] text-muted-foreground">
                    Copy this snippet and use it in your application code to trigger the tour.
                  </p>
                </div>
              )}

              {/* Repeatable toggle (Click & External only) */}
              {triggerType !== "auto" && (
                <div className="flex items-center justify-between rounded-md border border-border bg-muted px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Allow re-triggering</p>
                    <p className="text-[10px] text-muted-foreground">
                      When enabled, users can trigger this tour again after completing or dismissing it.
                    </p>
                  </div>
                  <Switch checked={isRepeatable} onCheckedChange={setIsRepeatable} />
                </div>
              )}
            </div>

            {/* Site URL for selector validation */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Site URL (for selector validation)
              </Label>
              <Input
                value={selectedEnvUrl}
                onChange={e => setSelectedEnvUrl(e.target.value)}
                placeholder="https://your-app.com"
                className="bg-muted border border-border rounded"
              />
              <p className="text-[10px] text-muted-foreground">
                Enter your site URL to validate CSS selectors against your live page
              </p>
            </div>

            {/* Tour-level transition preset */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Transition Style
              </Label>
              <Select
                value={tourTransitionPreset || "default"}
                onValueChange={(v: string | null) => {
                  if (v) setTourTransitionPreset(v === "default" ? null : v);
                }}
              >
                <SelectTrigger className="w-48 bg-muted border border-border rounded">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">App Default</SelectItem>
                  {TRANSITION_PRESETS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Override the app-level transition for this tour. Steps can further override this.
              </p>
            </div>

            </div>
            <Separator />

            {/* Active step editor */}
            {activeStep ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Step {activeStepIndex + 1} Configuration
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveStep(activeStepIndex)}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Remove
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Title
                    </Label>
                    <Input
                      value={activeStep.title}
                      onChange={e => handleStepChange(activeStepIndex, "title", e.target.value)}
                      placeholder="Step title"
                      className="bg-muted border border-border rounded"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      CSS Selector
                    </Label>
                    <div data-onboarding="selector-field">
                      <SelectorValidator
                        value={activeStep.targetSelector}
                        onChange={(v) => handleStepChange(activeStepIndex, "targetSelector", v)}
                        environmentUrl={selectedEnvUrl || undefined}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Content
                    </Label>
                    <RichTextEditor
                      content={activeStep.content}
                      onChange={(html) => handleStepChange(activeStepIndex, "content", html)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Placement
                    </Label>
                    <Select
                      value={activeStep.placement}
                      onValueChange={(v: string | null) => {
                        if (v) handleStepChange(activeStepIndex, "placement", v);
                      }}
                    >
                      <SelectTrigger className="w-40 bg-muted border border-border rounded">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Transition Style
                    </Label>
                    <Select
                      value={activeStep.transitionPreset || "default"}
                      onValueChange={(v: string | null) => {
                        if (v) handleStepChange(activeStepIndex, "transitionPreset", v === "default" ? "" : v);
                      }}
                    >
                      <SelectTrigger className="w-48 bg-muted border border-border rounded">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Tour Default</SelectItem>
                        {TRANSITION_PRESETS.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <StepPreview
                    step={activeStep}
                    stepIndex={activeStepIndex}
                    totalSteps={steps.length}
                    themeColors={themeColors}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Plus className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No step selected
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Add a step from the sidebar to get started.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
