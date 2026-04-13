"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth route error:", error);
  }, [error]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>
          {error.message || "We couldn't complete that request. Please try again."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset} className="w-full">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
