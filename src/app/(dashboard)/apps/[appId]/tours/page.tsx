"use client";

import { useTours, useCreateTour, useDeleteTour, useTourCompletionRates, useApp, useUpdateAppTheme } from "@/lib/api/hooks";
import { useActiveWorkspace } from "@/providers/active-workspace-provider";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CompletionBar } from "@/components/shared/completion-bar";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { ThemeEditor } from "@/components/tours/theme-editor";
import { WebhookConfigCard } from "@/components/webhooks/webhook-config-card";
import { WebhookDeliveryLog } from "@/components/webhooks/webhook-delivery-log";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Route, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useOnboarding } from "@/providers/onboarding-provider";

type TabFilter = "all" | "draft" | "published";

const getTourIconColor = (isPublished: boolean) =>
  isPublished ? "bg-success" : "bg-warning";

export default function ToursPage() {
  const params = useParams();
  const router = useRouter();
  const { wsId } = useActiveWorkspace();
  const appId = Number(params.appId);
  const { data, isLoading } = useTours(appId);
  const { data: completionData } = useTourCompletionRates(appId);
  const { data: app } = useApp(wsId ?? 0, appId);
  const updateTheme = useUpdateAppTheme(wsId ?? 0, appId);
  const createMutation = useCreateTour(appId);
  const deleteMutation = useDeleteTour(appId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const { currentStage, tourId: onboardingTourId } = useOnboarding();

  // During onboarding, auto-navigate into the sample tour editor
  useEffect(() => {
    if (currentStage === "appCreated" && onboardingTourId) {
      router.replace(`/apps/${appId}/tours/${onboardingTourId}`);
    }
  }, [currentStage, onboardingTourId, appId, router]);

  const items = data?.items ?? [];
  const filteredTours = activeTab === "all"
    ? items
    : activeTab === "published"
      ? items.filter((t) => t.isPublished)
      : items.filter((t) => !t.isPublished);

  const handleCreate = async () => {
    const result = await createMutation.mutateAsync({
      name,
      description: description || undefined,
    });
    setName("");
    setDescription("");
    setOpen(false);
    router.push(`/apps/${appId}/tours/${result.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tours"
        description="Product tours for this app"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>Create Tour</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tour</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tour-name">Name</Label>
                  <Input
                    id="tour-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Welcome Tour"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tour-desc">Description</Label>
                  <Textarea
                    id="tour-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief tour of the main features..."
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Tab filter bar */}
      <div className="flex gap-1 border-b border-border">
        {(["all", "draft", "published"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "all" ? "All Tours" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading tours...
          </p>
        </div>
      )}

      {/* Empty state */}
      {data && data.items.length === 0 && (
        <EmptyState
          title="No tours"
          description="Create your first tour to guide your users."
        />
      )}

      {/* Filtered empty state */}
      {data && data.items.length > 0 && filteredTours.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">
            No {activeTab.toLowerCase()} tours found.
          </p>
        </div>
      )}

      {/* Tours table */}
      {filteredTours.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tour Name
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Completion Rate
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Last Edited
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTours.map((tour) => (
                <TableRow
                  key={tour.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${getTourIconColor(tour.isPublished)}`}
                      >
                        <Route className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {tour.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tour.stepCount} {tour.stepCount === 1 ? "step" : "steps"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tour.isPublished ? "published" : "draft"} />
                  </TableCell>
                  <TableCell className="w-36">
                    <CompletionBar value={completionData?.find((t) => t.tourId === tour.id)?.completionRate ?? 0} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">
                      {new Date(tour.updatedAtUtc).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/apps/${appId}/tours/${tour.id}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget({ id: tour.id, name: tour.name })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Theme editor */}
      <Separator />
      <div className="rounded-lg border border-border bg-card p-6">
        <ThemeEditor
          currentThemeConfig={app?.themeConfig ?? null}
          onSave={async (config) => {
            await updateTheme.mutateAsync(config);
            toast.success("Theme saved");
          }}
          isSaving={updateTheme.isPending}
        />
      </div>

      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Tour"
        description={`This will permanently delete the tour "${deleteTarget?.name ?? ""}". This action cannot be undone.`}
        itemName={deleteTarget?.name ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Tour deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete tour"),
          });
        }}
      />

      {/* Webhooks */}
      <Separator />
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Webhooks</h2>
        <WebhookConfigCard appId={appId} />
        <WebhookDeliveryLog appId={appId} />
      </div>
    </div>
  );
}
