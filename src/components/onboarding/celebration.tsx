"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PartyPopper, Palette, BarChart3, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CelebrationProps {
  onDismiss: () => void;
  orgId: number;
  wsId: number;
  appId: number;
}

export function Celebration({ onDismiss, orgId, wsId, appId }: CelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const suggestions = [
    {
      icon: Palette,
      title: "Customize theme",
      description: "Match your brand colors",
      href: `/org/${orgId}/ws/${wsId}/apps/${appId}/tours`,
    },
    {
      icon: BarChart3,
      title: "View analytics",
      description: "Track tour engagement",
      href: `/dashboard`,
    },
    {
      icon: Chrome,
      title: "Chrome extension",
      description: "Pick selectors visually",
      href: "#",
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="mb-4 text-5xl">
          <PartyPopper className="mx-auto size-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Your first tour is live!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve just published a product tour to your website. Your users
          will see it on their next visit.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {suggestions.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-colors hover:bg-accent"
              onClick={(e) => {
                if (s.href === "#") e.preventDefault();
                onDismiss();
              }}
            >
              <s.icon className="size-5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {s.title}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {s.description}
              </span>
            </Link>
          ))}
        </div>
        <Button className="mt-6 w-full" onClick={onDismiss}>
          Got it, let&apos;s go!
        </Button>
      </div>
    </div>
  );
}
