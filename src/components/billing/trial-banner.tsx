"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useOrganisations } from "@/lib/api/hooks";

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: orgs } = useOrganisations();

  const hasTrialing = orgs?.items.some(
    (org) => org.subscriptionStatus === "Trialing",
  );

  if (dismissed || !hasTrialing) return null;

  return (
    <div className="flex items-center justify-between border-b border-blue-200 bg-blue-50 px-6 py-2.5 text-sm dark:border-blue-800 dark:bg-blue-950/50">
      <p className="text-blue-700 dark:text-blue-300">
        You&apos;re on a free trial &mdash; upgrade to keep your tours running.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-200"
        aria-label="Dismiss trial banner"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
