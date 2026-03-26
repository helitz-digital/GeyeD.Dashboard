"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SdkInstallSectionProps {
  apiKey: string;
  onVerify?: () => void;
  onSkip?: () => void;
}

export function SdkInstallSection({ apiKey, onVerify, onSkip }: SdkInstallSectionProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const scriptSnippet = `<script src="https://cdn.geyed.io/sdk.js"></script>
<script>
  Geyed.init({ apiKey: '${apiKey}', baseUrl: 'https://api.geyed.io' });
  Geyed.start();
</script>`;

  return (
    <div data-onboarding="install-snippet" className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Install the SDK</h3>
      
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Add this snippet before the closing &lt;/body&gt; tag:</p>
        <div className="relative">
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <code>{scriptSnippet}</code>
          </pre>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-2"
            onClick={() => copyToClipboard(scriptSnippet, "snippet")}
          >
            {copied === "snippet" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          data-onboarding="verify-button"
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={onVerify}
        >
          Verify Connection
        </Button>
        <span className="text-xs text-muted-foreground">or</span>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
