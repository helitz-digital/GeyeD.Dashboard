"use client";

import { OrgProvider } from "@/providers/org-provider";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <OrgProvider>{children}</OrgProvider>;
}
