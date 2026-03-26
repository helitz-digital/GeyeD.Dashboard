"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  onConfirm,
  isPending = false,
}: DeleteConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmText("");
    }
  }, [open]);

  const isMatch = confirmText === itemName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="confirm-delete" className="text-sm text-muted-foreground">
            Type <span className="font-semibold text-foreground">{itemName}</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={itemName}
            className="bg-muted"
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!isMatch || isPending}
          >
            {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
