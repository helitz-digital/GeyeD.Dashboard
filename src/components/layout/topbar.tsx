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
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { useState, useRef, useEffect } from "react";

function Breadcrumbs() {
  const pathname = usePathname();
  const params = useParams();

  const appId = params?.appId as string | undefined;
  const tourId = params?.tourId as string | undefined;

  const segments: { label: string; href: string }[] = [];

  if (pathname.startsWith("/dashboard")) {
    segments.push({ label: "Dashboard", href: "/dashboard" });
  } else if (pathname.startsWith("/analytics")) {
    segments.push({ label: "Analytics", href: "/analytics" });
  } else if (pathname.startsWith("/settings")) {
    segments.push({ label: "Settings", href: "/settings" });
  } else if (pathname.startsWith("/billing")) {
    segments.push({ label: "Billing", href: "/billing" });
  } else if (pathname.startsWith("/members")) {
    segments.push({ label: "Members", href: "/members" });
  } else if (pathname.startsWith("/apps")) {
    segments.push({
      label: "Apps",
      href: "/apps",
    });

    if (appId) {
      segments.push({
        label: "Tours",
        href: `/apps/${appId}/tours`,
      });

      if (tourId) {
        segments.push({
          label: "Tour Builder",
          href: `/apps/${appId}/tours/${tourId}`,
        });
      }
    }
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {segments.map((segment, index) => (
        <span key={segment.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight aria-hidden="true" className="size-3.5 text-muted-foreground/60" />
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
  const { restartOnboarding, isOnboarding, helpTrayRequested, consumeHelpTrayRequest } = useOnboarding();
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // Auto-open the help tray when requested (e.g. after payment success)
  useEffect(() => {
    if (helpTrayRequested) {
      setHelpOpen(true);
      consumeHelpTrayRequest();
    }
  }, [helpTrayRequested, consumeHelpTrayRequest]);

  // Close panel on click outside
  useEffect(() => {
    if (!helpOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [helpOpen]);

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

        <div ref={helpRef} className="relative">
          <button
            onClick={() => setHelpOpen((o) => !o)}
            className="relative flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <HelpCircle className="size-4" />
            <span className="sr-only">Help</span>
            {isOnboarding && (
              <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
            )}
          </button>

          {helpOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 rounded-lg border border-border bg-card shadow-lg z-50">
              {isOnboarding ? (
                <OnboardingChecklist onClose={() => setHelpOpen(false)} />
              ) : (
                <div className="p-2">
                  <button
                    onClick={() => {
                      restartOnboarding();
                      setHelpOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <PlayCircle className="size-4" />
                    Replay onboarding
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                aria-label={`Account menu for ${user?.displayName ?? user?.email ?? "user"}`}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground ring-1 ring-border transition-opacity hover:opacity-80"
              >
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
