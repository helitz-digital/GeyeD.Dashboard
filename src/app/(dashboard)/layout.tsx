"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner";
import { TrialBanner } from "@/components/billing/trial-banner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/providers/onboarding-provider";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isOnboarding } = useOnboarding();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        {!isOnboarding && user && !user.emailConfirmed && (
          <EmailVerificationBanner email={user.email} />
        )}
        {!isOnboarding && <TrialBanner />}
        <main className="p-12">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <DashboardContent>{children}</DashboardContent>
    </OnboardingProvider>
  );
}
