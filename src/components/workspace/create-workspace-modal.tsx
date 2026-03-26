"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
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
import { useCreateWorkspace } from "@/lib/api/hooks";
import { toast } from "sonner";

interface CreateWorkspaceModalProps {
  orgId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceModal({ orgId, open, onOpenChange }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const createWorkspace = useCreateWorkspace(orgId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const data = await createWorkspace.mutateAsync({ name: name.trim() });
      toast.success(`Workspace "${name.trim()}" created`);
      setName("");
      onOpenChange(false);
      router.push(`/org/${orgId}/ws/${data.id}/apps`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create workspace");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="size-5" />
            Create Workspace
          </DialogTitle>
          <DialogDescription>
            Workspaces help you organise your apps and tours into separate projects.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="e.g. Marketing, Product, Staging"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="bg-muted"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createWorkspace.isPending || !name.trim()}
            >
              {createWorkspace.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
