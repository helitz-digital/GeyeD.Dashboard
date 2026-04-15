"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useActiveWorkspace } from "@/providers/active-workspace-provider";
import { useUpdateOrganisation, useOrganisationMembers, useUpdateWorkspace, useDeleteWorkspace } from "@/lib/api/hooks";
import { useAuth } from "@/providers/auth-provider";

export default function SettingsPage() {
  const { orgId, org, wsId, workspace } = useActiveWorkspace();
  const { user } = useAuth();
  const { data: members } = useOrganisationMembers(orgId ?? 0);
  const updateOrg = useUpdateOrganisation(orgId ?? 0);
  const updateWs = useUpdateWorkspace(orgId ?? 0, wsId ?? 0);
  const deleteWs = useDeleteWorkspace(orgId ?? 0);
  const router = useRouter();

  const [orgName, setOrgName] = useState("");
  const [wsName, setWsName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = members?.some((m) => m.userId === user?.id && m.role === "Owner") ?? false;

  // Sync org name when data loads
  useEffect(() => {
    if (org?.name) {
      setOrgName(org.name);
    }
  }, [org?.name]);

  // Sync workspace name when data loads
  useEffect(() => {
    if (workspace?.name) {
      setWsName(workspace.name);
    }
  }, [workspace?.name]);

  const handleSaveOrg = async () => {
    try {
      await updateOrg.mutateAsync({ name: orgName });
      toast.success("Organisation updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update organisation");
    }
  };

  const handleSaveWs = async () => {
    try {
      await updateWs.mutateAsync({ name: wsName });
      toast.success("Workspace updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update workspace");
    }
  };

  return (
    <div className="space-y-12">
      <PageHeader
        title="Settings"
        description="Manage your organisation and workspace."
      />

      <div className="max-w-2xl space-y-8">
        {/* Organisation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organisation Name</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-muted"
              />
            </div>
            {isOwner && (
              <Button
                onClick={handleSaveOrg}
                disabled={updateOrg.isPending || orgName === org?.name}
              >
                {updateOrg.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Workspace Settings */}
        {wsId && workspace && (
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Workspace Name</Label>
                <Input
                  id="ws-name"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="bg-muted"
                />
              </div>
              <Button
                onClick={handleSaveWs}
                disabled={updateWs.isPending || wsName === workspace?.name}
              >
                {updateWs.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        {isOwner && wsId && workspace && (
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
          if (!wsId) return;
          deleteWs.mutate(wsId, {
            onSuccess: () => {
              toast.success("Workspace deleted");
              router.push("/settings");
            },
            onError: (err) =>
              toast.error(err instanceof Error ? err.message : "Failed to delete workspace"),
          });
        }}
      />
    </div>
  );
}
