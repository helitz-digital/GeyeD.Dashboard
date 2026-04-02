"use client";

import { createContext, useContext, useMemo } from "react";
import { useParams } from "next/navigation";
import { useOrganisations, useWorkspaces } from "@/lib/api/hooks";

/**
 * Global context that always provides the "active" org and workspace IDs.
 *
 * Resolution order:
 * 1. URL params (`orgId`/`wsId` from the route) — if present, use them.
 * 2. Otherwise, fall back to the user's first org and its first workspace.
 *
 * This means any component can call `useActiveWorkspace()` to get IDs for
 * building links like `/org/{orgId}/ws/{wsId}/apps` — even on pages like
 * `/dashboard` that don't have org/ws in the URL.
 */

interface ActiveWorkspaceContextValue {
  orgId: number | null;
  wsId: number | null;
  isLoading: boolean;
}

const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextValue>({
  orgId: null,
  wsId: null,
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

  const isLoading = orgsLoading || (!!resolvedOrgId && wsLoading);

  const value = useMemo(
    () => ({ orgId: resolvedOrgId, wsId: resolvedWsId, isLoading }),
    [resolvedOrgId, resolvedWsId, isLoading],
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
