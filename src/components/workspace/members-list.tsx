"use client";

import { useOrganisationMembers } from "@/lib/api/hooks";
import { Badge } from "@/components/ui/badge";

interface MembersListProps {
  orgId: number;
}

export function MembersList({ orgId }: MembersListProps) {
  const { data: members, isLoading } = useOrganisationMembers(orgId);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading members...</div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No members found.</div>
    );
  }

  return (
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
        </div>
      ))}
    </div>
  );
}
