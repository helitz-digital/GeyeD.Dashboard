"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  ChevronRight,
  LogOut,
  PlayCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/auth-provider";
import { useOnboarding } from "@/providers/onboarding-provider";
import { NotificationBell } from "@/components/layout/notification-bell";

function Breadcrumbs() {
  const pathname = usePathname();
  const params = useParams();

  const orgId = params?.orgId as string | undefined;
  const wsId = params?.wsId as string | undefined;
  const appId = params?.appId as string | undefined;
  const tourId = params?.tourId as string | undefined;

  const segments: { label: string; href: string }[] = [];

  if (pathname.startsWith("/dashboard")) {
    segments.push({ label: "Dashboard", href: "/dashboard" });
  } else if (orgId) {
    if (pathname.includes("/settings") && !pathname.includes("/ws/")) {
      segments.push({ label: "Organisation Settings", href: `/org/${orgId}/settings` });
    } else if (pathname.includes("/billing")) {
      segments.push({ label: "Billing", href: `/org/${orgId}/billing` });
    } else if (pathname.includes("/members")) {
      segments.push({ label: "Members", href: `/org/${orgId}/members` });
    } else if (wsId) {
      // Workspace settings stands alone — not under "Apps"
      if (pathname.endsWith("/settings")) {
        segments.push({
          label: "Workspace Settings",
          href: `/org/${orgId}/ws/${wsId}/settings`,
        });
      } else {
        segments.push({
          label: "Apps",
          href: `/org/${orgId}/ws/${wsId}/apps`,
        });

        if (appId) {
          segments.push({
            label: "Tours",
            href: `/org/${orgId}/ws/${wsId}/apps/${appId}/tours`,
          });

          if (tourId) {
            segments.push({
              label: "Tour Builder",
              href: `/org/${orgId}/ws/${wsId}/apps/${appId}/tours/${tourId}`,
            });
          }
        }
      }
    }
  } else if (pathname.startsWith("/analytics")) {
    segments.push({ label: "Analytics", href: "/analytics" });
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {segments.map((segment, index) => (
        <span key={segment.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
          )}
          {index === segments.length - 1 ? (
            <span className="font-semibold text-foreground">
              {segment.label}
            </span>
          ) : (
            <Link
              href={segment.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {segment.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Topbar() {
  const { user, logout } = useAuth();
  const { restartOnboarding } = useOnboarding();

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-8 backdrop-blur-sm">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-6">
        <Breadcrumbs />
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <HelpCircle className="size-4" />
                <span className="sr-only">Help</span>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => restartOnboarding()}>
              <PlayCircle className="mr-2 size-4" />
              Replay onboarding
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ring-1 ring-border transition-opacity hover:opacity-80">
                {initials}
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            {user && (
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium text-foreground">
                  {user.displayName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
