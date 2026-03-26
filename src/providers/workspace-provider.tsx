"use client";

import { createContext, useContext, useMemo } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/lib/api/hooks";
import { useOrgContext } from "./org-provider";
import type { WorkspaceRm } from "@/lib/api/types";

interface WorkspaceContextValue {
  wsId: number;
  workspace: WorkspaceRm | undefined;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { orgId } = useOrgContext();
  const wsId = Number(params.wsId);
  const { data: workspace, isLoading } = useWorkspace(orgId, wsId);
  const value = useMemo(() => ({ wsId, workspace, isLoading }), [wsId, workspace, isLoading]);
  return <WorkspaceContext value={value}>{children}</WorkspaceContext>;
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  return ctx;
}
