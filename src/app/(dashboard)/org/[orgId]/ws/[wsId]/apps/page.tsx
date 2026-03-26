"use client";

import { useApps, useCreateApp, useDeleteApp, useOrganisationMembers } from "@/lib/api/hooks";
import { useAuth } from "@/providers/auth-provider";
import { useOrgContext } from "@/providers/org-provider";
import { useWorkspaceContext } from "@/providers/workspace-provider";
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
import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AppsPage() {
  const { orgId, org } = useOrgContext();
  const { wsId } = useWorkspaceContext();
  const subscriptionStatus = org?.subscriptionStatus;
  const isSubscriptionActive =
    subscriptionStatus === "Trialing" ||
    subscriptionStatus === "Active" ||
    subscriptionStatus === "PastDue";
  const { data, isLoading } = useApps(isSubscriptionActive ? wsId : 0);
  const { data: members } = useOrganisationMembers(orgId);
  const { user } = useAuth();
  const createMutation = useCreateApp(wsId);
  const deleteMutation = useDeleteApp(wsId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const isOwner = members?.some((m) => m.userId === user?.id && m.role === "Owner") ?? false;

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({ name });
      setName("");
      setOpen(false);
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

      <SubscriptionGate status={subscriptionStatus} feature="apps" orgId={orgId}>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      
      {data && data.items.length === 0 && (
        <EmptyState title="No apps" description="Create your first app to start building tours." />
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map(app => (
          <Link key={app.id} href={`/org/${orgId}/ws/${wsId}/apps/${app.id}/tours`}>
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
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge data-onboarding="api-key" variant="secondary" className="bg-muted text-muted-foreground font-mono text-xs">{app.apiKey.substring(0, 16)}...</Badge>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigator.clipboard.writeText(app.apiKey);
                      toast.success("API key copied to clipboard");
                    }}
                    className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy API key"
                  >
                    <Copy className="size-3.5" />
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
