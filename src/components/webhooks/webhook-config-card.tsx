"use client";

import { useState, useEffect } from "react";
import {
  useWebhookConfig,
  useUpsertWebhook,
  useDeleteWebhook,
  useRegenerateWebhookSecret,
  useTestWebhook,
} from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Copy, RefreshCw, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function WebhookConfigCard({ appId }: { appId: number }) {
  const { data: config, isLoading } = useWebhookConfig(appId);
  const upsert = useUpsertWebhook(appId);
  const deleteWebhook = useDeleteWebhook(appId);
  const regenerateSecret = useRegenerateWebhookSecret(appId);
  const testWebhook = useTestWebhook(appId);

  const [url, setUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  // Sync form state when config loads
  useEffect(() => {
    if (config) {
      setUrl(config.url);
      setIsEnabled(config.isEnabled);
      setRevealedSecret(null);
      setShowSecret(false);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      const result = await upsert.mutateAsync({ url, isEnabled });
      // On first create, show the signing secret
      if (!config) {
        setRevealedSecret(result.signingSecret);
        setShowSecret(true);
        toast.success("Webhook created. Copy your signing secret now — it won't be shown in full again.");
      } else {
        toast.success("Webhook updated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save webhook");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWebhook.mutateAsync();
      setUrl("");
      setIsEnabled(true);
      setRevealedSecret(null);
      toast.success("Webhook deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete webhook");
    }
  };

  const handleRegenerate = async () => {
    try {
      const result = await regenerateSecret.mutateAsync();
      setRevealedSecret(result.signingSecret);
      setShowSecret(true);
      toast.success("Secret regenerated. Copy it now — it won't be shown in full again.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate secret");
    }
  };

  const handleTest = async () => {
    try {
      const result = await testWebhook.mutateAsync();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test");
    }
  };

  const copySecret = async () => {
    const secret = revealedSecret ?? config?.signingSecret;
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    toast.success("Signing secret copied");
  };

  const maskedSecret = config?.signingSecret
    ? config.signingSecret.slice(0, 8) + "••••••••••••••••"
    : null;

  const displaySecret = revealedSecret
    ? showSecret
      ? revealedSecret
      : revealedSecret.slice(0, 8) + "••••••••••••••••"
    : showSecret && config?.signingSecret
      ? config.signingSecret
      : maskedSecret;

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground animate-pulse py-4">
            Loading webhook config...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Receive HTTP callbacks when events occur in your app.
            </CardDescription>
          </div>
          {config && (
            <Badge variant={config.isEnabled ? "default" : "secondary"}>
              {config.isEnabled ? "Active" : "Disabled"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Endpoint URL</Label>
          <Input
            id="webhook-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks"
          />
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="webhook-enabled">Enabled</Label>
          <Switch
            id="webhook-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        {/* Signing Secret */}
        {(config || revealedSecret) && (
          <div className="space-y-2">
            <Label>Signing Secret</Label>
            {revealedSecret && (
              <p className="text-xs text-destructive">
                Copy this secret now. It will not be shown in full again.
              </p>
            )}
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-1.5 font-mono text-xs break-all">
                {displaySecret}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
                title={showSecret ? "Hide secret" : "Reveal secret"}
                aria-label={showSecret ? "Hide signing secret" : "Reveal signing secret"}
              >
                {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copySecret}
                title="Copy secret"
                aria-label="Copy signing secret"
              >
                <Copy className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRegenerate}
                disabled={regenerateSecret.isPending}
                title="Regenerate secret"
                aria-label="Regenerate signing secret"
              >
                <RefreshCw className={`size-4 ${regenerateSecret.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={upsert.isPending || !url.trim()}
          >
            {upsert.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : config ? (
              "Save Changes"
            ) : (
              "Create Webhook"
            )}
          </Button>
          {config && (
            <>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testWebhook.isPending}
              >
                {testWebhook.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Test
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteWebhook.isPending}
              >
                {deleteWebhook.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
