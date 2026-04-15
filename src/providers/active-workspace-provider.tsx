"use client";

import { createContext, useContext, useMemo } from "react";
import { useParams } from "next/navigation";
import { useOrganisations, useWorkspaces } from "@/lib/api/hooks";
import type { OrganisationRm, WorkspaceRm } from "@/lib/api/types";

/**
 * Global context that always provides the "active" org and workspace IDs.
 *
 * Resolution order:
 * 1. URL params (`orgId`/`wsId` from the route) — if present, use them.
 * 2. Otherwise, fall back to the user's first org and its first workspace.
 *
 * This means any component can call `useActiveWorkspace()` to get IDs,
 * the full org/workspace objects, and loading state — without needing
 * org or workspace IDs in the URL.
 */

interface ActiveWorkspaceContextValue {
  orgId: number | null;
  wsId: number | null;
  org: OrganisationRm | null;
  workspace: WorkspaceRm | null;
  isLoading: boolean;
}

const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextValue>({
  orgId: null,
  wsId: null,
  org: null,
  workspace: null,
  isLoading: true,
});

export function ActiveWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const routeOrgId = params?.orgId ? Number(params.orgId) : null;
  const routeWsId = params?.wsId ? Number(params.wsId) : null;

  // Fetch user's orgs (always, for the fallback)
  const { data: orgsData, isLoading: orgsLoading } = useOrganisations(1, 1);
  const fallbackOrgId = orgsData?.items?.[0]?.id ?? null;

  const resolvedOrgId = routeOrgId ?? fallbackOrgId;

  // Fetch workspaces for the resolved org
  const { data: wsData, isLoading: wsLoading } = useWorkspaces(resolvedOrgId ?? 0);
  const fallbackWsId = wsData?.items?.[0]?.id ?? null;

  const resolvedWsId = routeWsId ?? fallbackWsId;

  // Derive full objects from already-fetched list data (avoids extra API calls)
  const org = orgsData?.items?.find((o) => o.id === resolvedOrgId) ?? null;
  const workspace = wsData?.items?.find((w) => w.id === resolvedWsId) ?? null;

  const isLoading = orgsLoading || (!!resolvedOrgId && wsLoading);

  const value = useMemo(
    () => ({ orgId: resolvedOrgId, wsId: resolvedWsId, org, workspace, isLoading }),
    [resolvedOrgId, resolvedWsId, org, workspace, isLoading],
  );

  return (
    <ActiveWorkspaceContext value={value}>
      {children}
    </ActiveWorkspaceContext>
  );
}

export function useActiveWorkspace(): ActiveWorkspaceContextValue {
  return useContext(ActiveWorkspaceContext);
}
