"use client";

import { useApp } from "@/lib/api/hooks";
import { useActiveWorkspace } from "@/providers/active-workspace-provider";
import { useOnboarding, ONBOARDING_TOUR_IDS } from "@/providers/onboarding-provider";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Copy, Check, Link2, Terminal, Globe, Code2, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label ? `${label} copied` : "Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Copy"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border border-border bg-muted/50 p-4 text-xs leading-relaxed text-foreground font-mono">
        <code>{code}</code>
      </pre>
      <div className="absolute right-2 top-2">
        <CopyButton text={code} label={label} />
      </div>
    </div>
  );
}

export default function SetupPage() {
  const params = useParams();
  const router = useRouter();
  const { wsId } = useActiveWorkspace();
  const appId = Number(params.appId);
  const { data: app } = useApp(wsId ?? 0, appId);
  const { currentStage, advanceStage, tourId, startOnboardingTour } = useOnboarding();

  const apiKey = app?.apiKey ?? app?.apiKeyPrefix ?? "";

  // Trigger the SDK install overlay tour during onboarding
  useEffect(() => {
    if (currentStage !== "tourCreated" || !app) return;

    const timer = setTimeout(() => {
      startOnboardingTour(ONBOARDING_TOUR_IDS.INSTALL_SDK);
    }, 600);
    return () => clearTimeout(timer);
  }, [currentStage, app, startOnboardingTour]);

  const handleContinue = async () => {
    if (currentStage === "tourCreated") {
      await advanceStage("sdkInstalled");
    }
    if (tourId) {
      router.push(`/apps/${appId}/tours/${tourId}`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Setup link copied — share it with your developer");
  };

  const cdnSnippet = `<!-- Add before </body> -->
<script src="https://cdn.geyed.io/sdk.js"></script>
<script>
  Geyed.init({
    apiKey: '${apiKey}',
    baseUrl: 'https://api.geyed.io'
  });
  Geyed.start();
</script>`;

  const npmInstall = `npm install @geyed/sdk`;

  const npmSnippet = `import Geyed from '@geyed/sdk';

Geyed.init({
  apiKey: '${apiKey}',
  baseUrl: 'https://api.geyed.io'
});

Geyed.start();`;

  const reactSnippet = `// app/layout.tsx or _app.tsx
import { useEffect } from 'react';

export default function Layout({ children }) {
  useEffect(() => {
    import('@geyed/sdk').then(({ default: Geyed }) => {
      Geyed.init({
        apiKey: '${apiKey}',
        baseUrl: 'https://api.geyed.io'
      });
      Geyed.start();
    });
  }, []);

  return <>{children}</>;
}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Setup"
        description="Install the SDK in your application"
        action={
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
            <Link2 className="size-3.5" />
            Copy setup link
          </Button>
        }
      />

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Choose your preferred installation method. All snippets include your API key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div data-onboarding="install-snippet">
            <Tabs defaultValue="cdn">
              <TabsList>
                <TabsTrigger value="cdn" className="gap-1.5">
                  <Globe className="size-3.5" />
                  CDN
                </TabsTrigger>
                <TabsTrigger value="npm" className="gap-1.5">
                  <Terminal className="size-3.5" />
                  npm
                </TabsTrigger>
                <TabsTrigger value="react" className="gap-1.5">
                  <Code2 className="size-3.5" />
                  React / Next.js
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cdn" className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  The fastest way to get started. Add this snippet before the closing <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">&lt;/body&gt;</code> tag on every page where you want tours to run.
                </p>
                <CodeBlock code={cdnSnippet} label="CDN snippet" />
              </TabsContent>

              <TabsContent value="npm" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground">1. Install the package</p>
                  <CodeBlock code={npmInstall} label="Install command" />
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground">2. Initialise in your app entry point</p>
                  <CodeBlock code={npmSnippet} label="Init snippet" />
                </div>
              </TabsContent>

              <TabsContent value="react" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground">1. Install the package</p>
                  <CodeBlock code={npmInstall} label="Install command" />
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground">2. Add to your root layout</p>
                  <CodeBlock code={reactSnippet} label="React snippet" />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Your API Key
          </CardTitle>
          <CardDescription>
            This key identifies your app. Keep it private — never commit it to a public repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge
              data-onboarding="api-key"
              variant="secondary"
              className="bg-muted text-foreground font-mono text-xs px-3 py-1.5"
            >
              {apiKey}
            </Badge>
            <CopyButton text={apiKey} label="API key" />
          </div>
        </CardContent>
      </Card>

      {/* Verify Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Verify Installation
          </CardTitle>
          <CardDescription>
            Once you've added the SDK, open your browser console on your site and look for the Geyed connection log.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            code={`// You should see this in your browser console:\nGeyed: connected (apiKey: ${apiKey.substring(0, 8)}...)`}
            label="Expected output"
          />
        </CardContent>
      </Card>

      {/* Onboarding: continue to next step */}
      {currentStage === "tourCreated" && (
        <div className="flex items-center justify-end">
          <Button size="sm" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
