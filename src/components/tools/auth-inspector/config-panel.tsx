"use client";

import { LogIn, ShieldAlert, ShieldCheck } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthInspectorConfig } from "@/lib/auth-inspector";
import { cn } from "@/lib/utils";

export type SiteStatus = "idle" | "connected" | "not-found";

const STATUS_LABEL: Record<SiteStatus, string> = {
  idle: "Not started",
  connected: "Connected — token captured",
  "not-found": "Back here — no token found yet",
};

const STATUS_STYLE: Record<SiteStatus, string> = {
  idle: "text-muted-foreground",
  connected: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "not-found": "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const STATUS_ICON: Record<SiteStatus, ReactNode> = {
  idle: null,
  connected: <ShieldCheck />,
  "not-found": <ShieldAlert />,
};

export function ConfigPanel({
  config,
  onConfigChange,
  status,
  onLogin,
}: {
  config: AuthInspectorConfig;
  onConfigChange: (config: AuthInspectorConfig) => void;
  status: SiteStatus;
  onLogin: () => void;
}) {
  function update<K extends keyof AuthInspectorConfig>(key: K, value: AuthInspectorConfig[K]) {
    onConfigChange({ ...config, [key]: value });
  }

  function handleUrlKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && config.url.trim()) {
      event.preventDefault();
      onLogin();
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <label className="text-sm font-medium">App URL</label>
        <Input
          value={config.url}
          onChange={(event) => update("url", event.target.value)}
          onKeyDown={handleUrlKeyDown}
          placeholder="https://your-app.example.com/login"
          className="font-mono text-xs"
        />
        <Button size="sm" onClick={onLogin} disabled={!config.url.trim()} className="w-full">
          <LogIn />
          {status === "idle" ? "Login" : "Log in again"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Opens in this tab. If the site&apos;s login redirects back here when it&apos;s done, the token shows up
          automatically — otherwise use the browser&apos;s Back button and paste the token manually.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("w-fit", STATUS_STYLE[status])}>
            {STATUS_ICON[status]}
            {STATUS_LABEL[status]}
          </Badge>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 border-t pt-3">
        <label className="text-xs font-medium text-muted-foreground">Token key name</label>
        <Input
          value={config.tokenKey}
          onChange={(event) => update("tokenKey", event.target.value)}
          placeholder="e.g. access_token (blank = auto-detect)"
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Checked in this page&apos;s localStorage, sessionStorage, and URL (query string/hash) as soon as it loads. Leave
          blank to try common key names automatically.
        </p>
      </div>
    </div>
  );
}
