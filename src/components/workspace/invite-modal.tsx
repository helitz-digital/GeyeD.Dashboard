"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { UserPlus, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useInviteToOrganisation, useOrganisationInvitations, useRevokeOrganisationInvitation } from "@/lib/api/hooks";
import { toast } from "sonner";

interface InviteModalProps {
  trigger?: React.ReactElement;
}

export function InviteModal({ trigger }: InviteModalProps) {
  const params = useParams();
  const orgId = params?.orgId ? Number(params.orgId) : 0;

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const { data: invitations } = useOrganisationInvitations(orgId);
  const invite = useInviteToOrganisation(orgId);
  const revoke = useRevokeOrganisationInvitation(orgId);

  const isContextual = orgId > 0;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await invite.mutateAsync(email.trim());
      setEmail("");
      toast.success(`Invitation sent to ${email.trim()}`);
    } catch (err: any) {
      const message = err?.message ?? "Failed to send invitation";
      toast.error(message.includes("already") ? message : `Failed to invite: ${message}`);
    }
  }

  async function handleRevoke(invitationId: number, invitedEmail: string) {
    try {
      await revoke.mutateAsync(invitationId);
      toast.success(`Invitation to ${invitedEmail} revoked`);
    } catch {
      toast.error("Failed to revoke invitation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="secondary" size="sm" className="cursor-pointer rounded-xl bg-accent text-accent-foreground hover:bg-accent/80">
              <UserPlus className="mr-2 size-3.5" />
              Invite Team
            </Button>
          ) as React.ReactElement
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
          <DialogDescription>
            {isContextual
              ? "Send an invitation to join this organisation."
              : "Navigate into an organisation to invite members."}
          </DialogDescription>
        </DialogHeader>

        {isContextual ? (
          <div className="space-y-6">
            {/* Invite form */}
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email address</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-muted"
                  />
                  <Button
                    type="submit"
                    disabled={invite.isPending || !email.trim()}
                    className="shrink-0 cursor-pointer"
                  >
                    {invite.isPending ? "Sending..." : "Invite"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                An invitation link will be sent to this address. It expires in 7 days.
              </p>
            </form>

            {/* Pending invitations */}
            {invitations && invitations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Pending Invitations
                </p>
                <div className="space-y-1.5">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm text-foreground">{inv.invitedEmail}</span>
                      </div>
                      <button
                        onClick={() => handleRevoke(inv.id, inv.invitedEmail)}
                        disabled={revoke.isPending}
                        className="ml-2 shrink-0 cursor-pointer rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Revoke invitation"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Please navigate into an organisation first, then use Invite Team to add members.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
