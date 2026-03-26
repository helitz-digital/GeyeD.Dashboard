"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  CreditCard,
  Users,
  Plus,
  Building2,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganisations, useWorkspaces, useApp, useOrganisationMembers } from "@/lib/api/hooks";
import { useAuth } from "@/providers/auth-provider";
import { CreateWorkspaceModal } from "@/components/workspace/create-workspace-modal";
import { WorkspaceSettingsModal } from "@/components/workspace/workspace-settings-modal";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();

  const routeOrgId = params?.orgId as string | undefined;
  const wsId = params?.wsId as string | undefined;
  const appId = params?.appId as string | undefined;

  const { user } = useAuth();
  const { data: orgsData } = useOrganisations();

  // Fall back to the user's first org when not on an /org/{id} route (e.g. /dashboard)
  const resolvedOrgId = routeOrgId
    ? Number(routeOrgId)
    : orgsData?.items?.[0]?.id ?? 0;
  const orgId = resolvedOrgId || undefined;
  const wsIdNum = wsId ? Number(wsId) : 0;
  const appIdNum = appId ? Number(appId) : 0;

  const { data: workspacesData } = useWorkspaces(resolvedOrgId);
  const { data: app } = useApp(wsIdNum, appIdNum);
  const { data: members } = useOrganisationMembers(resolvedOrgId);

  const isOwner = members?.some((m) => m.userId === user?.id && m.role === "Owner") ?? false;
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [wsSettingsOpen, setWsSettingsOpen] = useState(false);

  const currentOrg = orgsData?.items.find((o) => o.id === resolvedOrgId);
  const currentWs = workspacesData?.items.find((w) => w.id === wsIdNum);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside data-onboarding="sidebar" className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar">
      {/* Logo Section */}
      <div className="flex items-center gap-3 p-6">
        <div className="flex size-8 items-center justify-center rounded bg-primary">
          <span className="text-xs font-bold text-primary-foreground">G</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Geyed
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Tour Platform
          </p>
        </div>
      </div>

      {/* Org Switcher - only shown when user is a member of multiple orgs */}
      {orgsData && orgsData.items.length > 1 && (
        <div className="px-3 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-left">{currentOrg?.name ?? "Select org"}</span>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-56">
              {orgsData.items.map((org) => (
                <Link key={org.id} href={`/org/${org.id}/members`}>
                  <DropdownMenuItem>
                    <Building2 className="mr-2 size-4" />
                    {org.name}
                  </DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Workspace Switcher (within org) */}
      {orgId && workspacesData && (
        <div data-onboarding="workspace-switcher" className="flex items-center gap-1 px-3 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-left">{currentWs?.name ?? "Select workspace"}</span>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <DropdownMenuContent align="start" className="w-56">
              {workspacesData.items.map((ws) => (
                <Link key={ws.id} href={`/org/${orgId}/ws/${ws.id}/apps`}>
                  <DropdownMenuItem>
                    <FolderOpen className="mr-2 size-4" />
                    {ws.name}
                  </DropdownMenuItem>
                </Link>
              ))}
              <DropdownMenuItem onClick={() => setCreateWsOpen(true)}>
                <Plus className="mr-2 size-4" />
                New Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {currentWs && (
            <button
              onClick={() => setWsSettingsOpen(true)}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Workspace settings"
            >
              <Settings className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md px-4 py-2 text-sm font-medium tracking-tight transition-colors",
              isActive("/dashboard")
                ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
            )}
          >
            <LayoutDashboard className="size-[18px]" />
            Dashboard
          </Link>

          <Link
            href="/analytics"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md px-4 py-2 text-sm font-medium tracking-tight transition-colors",
              isActive("/analytics")
                ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
            )}
          >
            <BarChart3 className="size-[18px]" />
            Analytics
          </Link>

          {/* Workspace section */}
          {orgId && wsId && (
            <div className="pt-4">
              <p className="mb-1 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Workspace
              </p>
              <Link
                data-onboarding="apps-nav"
                href={`/org/${orgId}/ws/${wsId}/apps`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-4 py-2 text-sm font-medium tracking-tight transition-colors",
                  pathname.includes(`/ws/${wsId}/apps`)
                    ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                )}
              >
                <FolderOpen className="size-[18px]" />
                Apps
              </Link>

              {/* Contextual app name */}
              {appId && app && (
                <Link
                  href={`/org/${orgId}/ws/${wsId}/apps/${appId}/tours`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md py-2 pl-10 pr-4 text-sm font-medium transition-colors",
                    pathname.includes(`/apps/${appId}`)
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground hover:text-sidebar-primary"
                  )}
                >
                  {app.name}
                </Link>
              )}
            </div>
          )}

          {/* Organisation section */}
          {orgId && (
            <div className="pt-4">
              <p className="mb-1 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Organisation
              </p>
              <Link
                href={`/org/${orgId}/members`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-4 py-2 text-sm font-medium tracking-tight transition-colors",
                  isActive(`/org/${orgId}/members`)
                    ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                )}
              >
                <Users className="size-[18px]" />
                Members
              </Link>
              {isOwner && (
                <Link
                  href={`/org/${orgId}/billing`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md px-4 py-2 text-sm font-medium tracking-tight transition-colors",
                    isActive(`/org/${orgId}/billing`)
                      ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                  )}
                >
                  <CreditCard className="size-[18px]" />
                  Billing
                </Link>
              )}
              <Link
                href={`/org/${orgId}/settings`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-4 py-2 text-sm font-medium tracking-tight transition-colors",
                  isActive(`/org/${orgId}/settings`)
                    ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary"
                )}
              >
                <Settings className="size-[18px]" />
                Settings
              </Link>
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* Modals */}
      {resolvedOrgId > 0 && (
        <CreateWorkspaceModal
          orgId={resolvedOrgId}
          open={createWsOpen}
          onOpenChange={setCreateWsOpen}
        />
      )}
      {resolvedOrgId > 0 && currentWs && (
        <WorkspaceSettingsModal
          orgId={resolvedOrgId}
          workspace={currentWs}
          isOwner={isOwner}
          open={wsSettingsOpen}
          onOpenChange={setWsSettingsOpen}
        />
      )}
    </aside>
  );
}
