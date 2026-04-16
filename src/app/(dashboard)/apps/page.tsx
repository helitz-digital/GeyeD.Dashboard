"use client";

import { useApps, useCreateApp, useDeleteApp, useOrganisationMembers } from "@/lib/api/hooks";
import { useAuth } from "@/providers/auth-provider";
import { useActiveWorkspace } from "@/providers/active-workspace-provider";
import { useOnboarding, ONBOARDING_TOUR_IDS } from "@/providers/onboarding-provider";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AppsPage() {
  const { orgId, wsId, org } = useActiveWorkspace();
  const subscriptionStatus = org?.subscriptionStatus;
  const isSubscriptionActive =
    subscriptionStatus === "Trialing" ||
    subscriptionStatus === "Active" ||
    subscriptionStatus === "PastDue";
  const { data, isLoading } = useApps(isSubscriptionActive ? (wsId ?? 0) : 0);
  const { data: members } = useOrganisationMembers(orgId ?? 0);
  const { user } = useAuth();
  const createMutation = useCreateApp(wsId ?? 0);
  const deleteMutation = useDeleteApp(wsId ?? 0);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const isOwner = members?.some((m) => m.userId === user?.id && m.role === "Owner") ?? false;
  const router = useRouter();
  const { advanceStage, currentStage, startOnboardingTour } = useOnboarding();

  // Trigger the Create App overlay tour when arriving at the orientationComplete stage
  useEffect(() => {
    if (currentStage !== "orientationComplete") return;

    const timer = setTimeout(() => {
      startOnboardingTour(ONBOARDING_TOUR_IDS.CREATE_APP);
    }, 600);
    return () => clearTimeout(timer);
  }, [currentStage, startOnboardingTour]);

  const handleCreate = async () => {
    try {
      const app = await createMutation.mutateAsync({ name });
      setName("");
      setOpen(false);

      // Advance onboarding when the user creates their first app,
      // then navigate into the tour editor so the journey continues
      if (currentStage === "orientationComplete") {
        await advanceStage("appCreated", { appId: app.id });
        router.push(`/apps/${app.id}/tours`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create app.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Apps"
        description="Applications in this workspace"
        action={
          isSubscriptionActive ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button data-onboarding="create-app-button" />}>
                Create App
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create App</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="app-name">Name</Label>
                    <Input id="app-name" className="bg-muted" value={name} onChange={e => setName(e.target.value)} placeholder="My App" />
                  </div>
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <SubscriptionGate status={subscriptionStatus} feature="apps" orgId={orgId ?? undefined}>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      
      {data && data.items.length === 0 && (
        <EmptyState title="No apps" description="Create your first app to start building tours." />
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map(app => (
          <Link key={app.id} href={`/apps/${app.id}/tours`}>
            <Card className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">{app.name}</CardTitle>
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget({ id: app.id, name: app.name });
                      }}
                      className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete app"
                      aria-label={`Delete app ${app.name}`}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge data-onboarding="api-key" variant="secondary" className="bg-muted text-muted-foreground font-mono text-xs">{app.apiKeyPrefix}...</Badge>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigator.clipboard.writeText(app.apiKeyPrefix);
                      toast.success("API key copied to clipboard");
                    }}
                    className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy API key"
                    aria-label={`Copy API key for ${app.name}`}
                  >
                    <Copy aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Created {new Date(app.createdAtUtc).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete App"
        description={`This will permanently delete the app "${deleteTarget?.name ?? ""}" and all its tours. This action cannot be undone.`}
        itemName={deleteTarget?.name ?? ""}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("App deleted");
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete app"),
          });
        }}
      />
      </SubscriptionGate>
    </div>
  );
}
