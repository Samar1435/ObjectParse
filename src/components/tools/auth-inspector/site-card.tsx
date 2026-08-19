"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfigPanel, type SiteStatus } from "@/components/tools/auth-inspector/config-panel";
import { StorageFieldsPanel } from "@/components/tools/auth-inspector/storage-fields-panel";
import { TokenPanel } from "@/components/tools/auth-inspector/token-panel";
import type { AuthInspectorConfig, AuthInspectorField, AuthInspectorSite, ResolvedToken } from "@/lib/auth-inspector";

function deriveStatus(site: AuthInspectorSite): SiteStatus {
  if (site.capturedToken) return "connected";
  if (site.lastCheckedAt) return "not-found";
  return "idle";
}

export function AuthInspectorSiteCard({
  site,
  onChange,
  onLogin,
  onRemove,
}: {
  site: AuthInspectorSite;
  onChange: (patch: Partial<AuthInspectorSite>) => void;
  onLogin: () => void;
  onRemove?: () => void;
}) {
  function updateConfig(config: AuthInspectorConfig) {
    onChange({ config });
  }

  function updateFields(fields: AuthInspectorField[]) {
    onChange({ fields });
  }

  function setManualToken(value: string) {
    const token: ResolvedToken = { source: "manual", key: "manual", value };
    onChange({ capturedToken: token });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <Input
          value={site.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Site name (e.g. GitHub)"
          className="max-w-56 font-medium"
        />
        {onRemove ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="ml-auto text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${site.name || "site"}`}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <ConfigPanel config={site.config} onConfigChange={updateConfig} status={deriveStatus(site)} onLogin={onLogin} />
        <TokenPanel token={site.capturedToken} lastCheckedAt={site.lastCheckedAt} onManualToken={setManualToken} />
      </div>
      <StorageFieldsPanel entries={site.lastScanEntries} fields={site.fields} onFieldsChange={updateFields} />
    </div>
  );
}
