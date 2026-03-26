"use client";

import { createContext, useContext, useMemo } from "react";
import { useParams } from "next/navigation";
import { useOrganisation } from "@/lib/api/hooks";
import type { OrganisationRm } from "@/lib/api/types";

interface OrgContextValue {
  orgId: number;
  org: OrganisationRm | undefined;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const orgId = Number(params.orgId);
  const { data: org, isLoading } = useOrganisation(orgId);
  const value = useMemo(() => ({ orgId, org, isLoading }), [orgId, org, isLoading]);
  return <OrgContext value={value}>{children}</OrgContext>;
}

export function useOrgContext() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrgContext must be used within OrgProvider");
  return ctx;
}
