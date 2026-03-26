"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useAcceptOrganisationInvitation } from "@/lib/api/hooks";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { isAuthenticated, isLoading } = useAuth();
  const acceptInvitation = useAcceptOrganisationInvitation();
  const [status, setStatus] = useState<"idle" | "accepting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid invitation link.");
      return;
    }

    // If not authenticated, redirect to login with token preserved
    if (!isAuthenticated) {
      router.push(`/login?redirect=/accept-invitation?token=${encodeURIComponent(token)}`);
      return;
    }

    // Auto-accept once authenticated
    if (status === "idle") {
      setStatus("accepting");
      acceptInvitation.mutate(token, {
        onSuccess: () => setStatus("success"),
        onError: (err: any) => {
          setStatus("error");
          setErrorMessage(err?.message ?? "Failed to accept invitation.");
        },
      });
    }
  }, [isLoading, isAuthenticated, token, status]);

  if (isLoading || status === "idle" || status === "accepting") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Accepting Invitation</CardTitle>
          <CardDescription>Please wait...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Invitation Accepted</CardTitle>
          <CardDescription>
            You&apos;ve been added to the organisation. Welcome to the team!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button className="w-full cursor-pointer">Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Invitation Failed</CardTitle>
        <CardDescription>
          {errorMessage || "This invitation link is invalid, expired, or has already been used."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/">
          <Button className="w-full cursor-pointer">Go to Dashboard</Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost" className="w-full cursor-pointer">Sign In</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Accept Invitation</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
