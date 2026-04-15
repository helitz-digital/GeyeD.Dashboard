"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useOrganisations, useWorkspaces } from "@/lib/api/hooks";
import type { OrganisationRm, WorkspaceRm } from "@/lib/api/types";

/**
 * Global context that always provides the "active" org and workspace IDs.
 *
 * Resolution order:
 * 1. User's persisted selection in localStorage (validated against the fetched list — stale IDs are dropped).
 * 2. First org / first workspace as a fallback for new users.
 *
 * Any component can call `useActiveWorkspace()` to get IDs, the full org/workspace objects,
 * loading state, and setters that persist a new selection. Switching the active org clears
 * the stored workspace so the provider falls back to the first workspace in the new org.
 */

const ORG_STORAGE_KEY = "geyed_active_org_id";
const WS_STORAGE_KEY = "geyed_active_ws_id";

interface ActiveWorkspaceContextValue {
  orgId: number | null;
  wsId: number | null;
  org: OrganisationRm | null;
  workspace: WorkspaceRm | null;
  isLoading: boolean;
  setActiveOrg: (id: number) => void;
  setActiveWorkspace: (id: number) => void;
}

const ActiveWorkspaceContext = createContext<ActiveWorkspaceContextValue>({
  orgId: null,
  wsId: null,
  org: null,
  workspace: null,
  isLoading: true,
  setActiveOrg: () => {},
  setActiveWorkspace: () => {},
});

function readStored(key: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function ActiveWorkspaceProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from localStorage after mount so SSR + client stay consistent.
  const [storedOrgId, setStoredOrgId] = useState<number | null>(null);
  const [storedWsId, setStoredWsId] = useState<number | null>(null);

  useEffect(() => {
    setStoredOrgId(readStored(ORG_STORAGE_KEY));
    setStoredWsId(readStored(WS_STORAGE_KEY));
  }, []);

  const { data: orgsData, isLoading: orgsLoading } = useOrganisations();
  const orgs = useMemo(() => orgsData?.items ?? [], [orgsData]);

  // Drop a stored org ID that no longer matches anything the user can see.
  const validStoredOrgId =
    storedOrgId && orgs.some((o) => o.id === storedOrgId) ? storedOrgId : null;
  const resolvedOrgId = validStoredOrgId ?? orgs[0]?.id ?? null;

  const { data: wsData, isLoading: wsLoading } = useWorkspaces(resolvedOrgId ?? 0);
  const workspaces = useMemo(() => wsData?.items ?? [], [wsData]);

  const validStoredWsId =
    storedWsId && workspaces.some((w) => w.id === storedWsId) ? storedWsId : null;
  const resolvedWsId = validStoredWsId ?? workspaces[0]?.id ?? null;

  const org = orgs.find((o) => o.id === resolvedOrgId) ?? null;
  const workspace = workspaces.find((w) => w.id === resolvedWsId) ?? null;

  const isLoading = orgsLoading || (!!resolvedOrgId && wsLoading);

  const setActiveOrg = useCallback((id: number) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ORG_STORAGE_KEY, String(id));
      // The stored workspace belongs to the previous org — clear it so the
      // provider falls back to the first workspace in the new org.
      window.localStorage.removeItem(WS_STORAGE_KEY);
    }
    setStoredOrgId(id);
    setStoredWsId(null);
  }, []);

  const setActiveWorkspace = useCallback((id: number) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WS_STORAGE_KEY, String(id));
    }
    setStoredWsId(id);
  }, []);

  const value = useMemo(
    () => ({
      orgId: resolvedOrgId,
      wsId: resolvedWsId,
      org,
      workspace,
      isLoading,
      setActiveOrg,
      setActiveWorkspace,
    }),
    [resolvedOrgId, resolvedWsId, org, workspace, isLoading, setActiveOrg, setActiveWorkspace],
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
