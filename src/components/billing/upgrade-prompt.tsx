"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface UpgradePromptProps {
  message: string;
  orgId: number;
}

export function UpgradePrompt({ message, orgId }: UpgradePromptProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/50">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="space-y-1">
        <p className="font-medium text-amber-800 dark:text-amber-200">
          {message}
        </p>
        <Link
          href="/billing"
          className="text-amber-700 underline underline-offset-2 transition-colors hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
        >
          Upgrade your plan
        </Link>
      </div>
    </div>
  );
}
