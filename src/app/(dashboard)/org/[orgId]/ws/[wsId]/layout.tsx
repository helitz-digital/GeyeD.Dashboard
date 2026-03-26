"use client";

import { WorkspaceProvider } from "@/providers/workspace-provider";

export default function WsLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
