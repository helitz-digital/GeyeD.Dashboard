"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setIsSending(true);
    try {
      await apiClient("/api/v1/auth/resend-confirmation", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      // Silently fail — endpoint always returns success to prevent enumeration
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-warning-bg border-b border-warning/20 px-6 py-2.5 flex items-center justify-between text-sm">
      <p className="text-warning">
        Your email address has not been verified. Please check your inbox for a confirmation link.
      </p>
      {sent ? (
        <span className="text-warning/80 text-sm shrink-0">Confirmation email sent!</span>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-warning hover:text-warning hover:bg-warning-bg/80 shrink-0"
          onClick={handleResend}
          disabled={isSending}
        >
          {isSending ? "Sending..." : "Resend email"}
        </Button>
      )}
    </div>
  );
}
