"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrgContext } from "@/providers/org-provider";
import { useUpdateOrganisation, useOrganisationMembers } from "@/lib/api/hooks";
import { useAuth } from "@/providers/auth-provider";

export default function OrgSettingsPage() {
  const { orgId, org } = useOrgContext();
  const { user } = useAuth();
  const { data: members } = useOrganisationMembers(orgId);
  const updateOrg = useUpdateOrganisation(orgId);

  const [name, setName] = useState("");

  const isOwner = members?.some((m) => m.userId === user?.id && m.role === "Owner") ?? false;

  // Sync name when org data loads
  useEffect(() => {
    if (org?.name) {
      setName(org.name);
    }
  }, [org?.name]);

  const handleSave = async () => {
    try {
      await updateOrg.mutateAsync({ name });
      toast.success("Organisation updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update organisation");
    }
  };

  return (
    <div className="space-y-12">
      <PageHeader
        title="Organisation Settings"
        description="Manage your organisation."
      />

      <div className="max-w-2xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organisation Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted"
              />
            </div>
            {isOwner && (
              <Button
                onClick={handleSave}
                disabled={updateOrg.isPending || name === org?.name}
              >
                {updateOrg.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
