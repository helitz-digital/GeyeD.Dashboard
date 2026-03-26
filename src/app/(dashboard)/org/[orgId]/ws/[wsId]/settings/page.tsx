"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrgContext } from "@/providers/org-provider";
import { useWorkspaceContext } from "@/providers/workspace-provider";
import { useUpdateWorkspace, useDeleteWorkspace, useOrganisationMembers } from "@/lib/api/hooks";
import { useAuth } from "@/providers/auth-provider";

export default function WorkspaceSettingsPage() {
  const { orgId } = useOrgContext();
  const { wsId, workspace } = useWorkspaceContext();
  const { user } = useAuth();
  const { data: members } = useOrganisationMembers(orgId);
  const updateWs = useUpdateWorkspace(orgId, wsId);
  const deleteWs = useDeleteWorkspace(orgId);
  const router = useRouter();

  const [name, setName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = members?.some((m) => m.userId === user?.id && m.role === "Owner") ?? false;

  // Sync name when workspace data loads
  useEffect(() => {
    if (workspace?.name) {
      setName(workspace.name);
    }
  }, [workspace?.name]);

  const handleSave = async () => {
    try {
      await updateWs.mutateAsync({ name });
      toast.success("Workspace updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update workspace");
    }
  };

  return (
    <div className="space-y-12">
      <PageHeader
        title="Workspace Settings"
        description="Manage your workspace."
      />

      <div className="max-w-2xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={updateWs.isPending || name === workspace?.name}
            >
              {updateWs.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deleting the workspace will permanently remove all its apps, tours, and data. This cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Workspace
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Workspace"
        description={`This will permanently delete "${workspace?.name ?? ""}" and all its apps, tours, and data. This action cannot be undone.`}
        itemName={workspace?.name ?? ""}
        isPending={deleteWs.isPending}
        onConfirm={() => {
          deleteWs.mutate(wsId, {
            onSuccess: () => {
              toast.success("Workspace deleted");
              router.push(`/org/${orgId}/settings`);
            },
            onError: (err) =>
              toast.error(err instanceof Error ? err.message : "Failed to delete workspace"),
          });
        }}
      />
    </div>
  );
}
