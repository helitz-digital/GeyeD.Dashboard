"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useOrganisationMembers,
  useRemoveOrganisationMember,
  useOrganisationInvitations,
  useInviteToOrganisation,
  useRevokeOrganisationInvitation,
} from "@/lib/api/hooks";
import { useActiveWorkspace } from "@/providers/active-workspace-provider";
import { useAuth } from "@/providers/auth-provider";

export default function OrgMembersPage() {
  const { orgId } = useActiveWorkspace();
  const { user } = useAuth();
  const { data: members, isLoading: membersLoading } = useOrganisationMembers(orgId ?? 0);
  const { data: invitations } = useOrganisationInvitations(orgId ?? 0);
  const removeMember = useRemoveOrganisationMember(orgId ?? 0);
  const invite = useInviteToOrganisation(orgId ?? 0);
  const revokeInvitation = useRevokeOrganisationInvitation(orgId ?? 0);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");

  const isOwner = members?.some((m) => m.userId === user?.id && m.role === "Owner") ?? false;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await invite.mutateAsync(email.trim());
      setEmail("");
      toast.success(`Invitation sent to ${email.trim()}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send invitation");
    }
  }

  async function handleRevoke(invitationId: number, invitedEmail: string) {
    try {
      await revokeInvitation.mutateAsync(invitationId);
      toast.success(`Invitation to ${invitedEmail} revoked`);
    } catch {
      toast.error("Failed to revoke invitation");
    }
  }

  async function handleRemoveMember(memberId: number, memberName: string) {
    try {
      await removeMember.mutateAsync(memberId);
      toast.success(`${memberName} removed from organisation`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to remove member");
    }
  }

  return (
    <div className="space-y-12">
      <PageHeader
        title="Members"
        description="Manage your organisation members and invitations."
        action={
          isOwner ? (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger render={<Button />}>
                <UserPlus className="mr-2 size-4" />
                Invite Member
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organisation.
                  </DialogDescription>
                </DialogHeader>
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
                      <Button type="submit" disabled={invite.isPending || !email.trim()} className="shrink-0">
                        {invite.isPending ? "Sending..." : "Invite"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    An invitation link will be sent to this address. It expires in 7 days.
                  </p>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="max-w-3xl space-y-8">
        {/* Members list */}
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <p className="text-sm text-muted-foreground">Loading members...</p>
            ) : !members || members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found.</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {(member.displayName || member.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {member.displayName || member.email}
                        </p>
                        {member.displayName && (
                          <p className="truncate text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          member.role === "Owner"
                            ? "bg-primary/10 text-primary text-xs"
                            : "bg-muted text-muted-foreground text-xs"
                        }
                      >
                        {member.role}
                      </Badge>
                      {isOwner && member.userId !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.displayName || member.email)}
                          disabled={removeMember.isPending}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending invitations */}
        {invitations && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
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
                    {isOwner && (
                      <button
                        onClick={() => handleRevoke(inv.id, inv.invitedEmail)}
                        disabled={revokeInvitation.isPending}
                        className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Revoke invitation"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
