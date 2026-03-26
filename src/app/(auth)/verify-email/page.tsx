"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && token) {
      apiClient<boolean>(`/api/v1/auth/confirm-email?userId=${userId}&token=${encodeURIComponent(token)}`)
        .then(async () => {
          // Refresh user data so the banner disappears immediately
          await refreshUser().catch(() => {});
          setStatus("success");
        })
        .catch((err) => {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Verification failed.");
        });
    } else {
      // No token params — shouldn't happen in normal flow, redirect to dashboard
      setStatus("error");
      setError("Invalid verification link.");
    }
  }, [userId, token]);

  if (status === "verifying") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Verifying Email</CardTitle>
          <CardDescription>Please wait...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verified</CardTitle>
          <CardDescription>Your email has been confirmed successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button className="w-full">Continue to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Verification Failed</CardTitle>
        <CardDescription>{error || "The verification link is invalid or has expired."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          If you&apos;re logged in, you can resend the verification email from the banner at the top of the dashboard.
        </p>
        <Link href="/dashboard">
          <Button className="w-full">Go to Dashboard</Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost" className="w-full">Sign In</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Email</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
