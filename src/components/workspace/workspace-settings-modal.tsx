"use client";

import { useState, useEffect } from "react";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog";
import { useUpdateWorkspace, useDeleteWorkspace } from "@/lib/api/hooks";
import { toast } from "sonner";
import type { WorkspaceListRm } from "@/lib/api/types";

interface WorkspaceSettingsModalProps {
  orgId: number;
  workspace: WorkspaceListRm | undefined;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkspaceSettingsModal({
  orgId,
  workspace,
  isOwner,
  open,
  onOpenChange,
}: WorkspaceSettingsModalProps) {
  const wsId = workspace?.id ?? 0;
  const updateWs = useUpdateWorkspace(orgId, wsId);
  const deleteWs = useDeleteWorkspace(orgId);

  const [name, setName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (workspace?.name) {
      setName(workspace.name);
    }
  }, [workspace?.name]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateWs.mutateAsync({ name: name.trim() });
      toast.success("Workspace updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update workspace");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Workspace Settings
            </DialogTitle>
            <DialogDescription>
              Manage your workspace name and settings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-settings-name">Workspace Name</Label>
              <Input
                id="ws-settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="bg-muted"
              />
            </div>
            <div className="flex items-center justify-between">
              {isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-1.5 size-3.5" />
                  Delete Workspace
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateWs.isPending || name.trim() === workspace?.name}
                >
                  {updateWs.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
              setDeleteOpen(false);
              onOpenChange(false);
              window.location.href = "/settings";
            },
            onError: (err) =>
              toast.error(err instanceof Error ? err.message : "Failed to delete workspace"),
          });
        }}
      />
    </>
  );
}
