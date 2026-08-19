"use client";

import { Plus, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyIconButton } from "@/components/tools/jwt/copy-icon-button";
import { DecodeSelect } from "@/components/tools/auth-inspector/decode-select";
import {
  decodeValue,
  guessDecodeMethod,
  type AuthInspectorField,
  type StorageArea,
  type StorageEntry,
} from "@/lib/auth-inspector";

const AREA_LABEL: Record<StorageArea, string> = {
  localStorage: "localStorage",
  sessionStorage: "sessionStorage",
  url: "the URL",
};

function StorageAreaSelect({ value, onChange }: { value: StorageArea; onChange: (area: StorageArea) => void }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as StorageArea)}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="localStorage">localStorage</SelectItem>
        <SelectItem value="sessionStorage">sessionStorage</SelectItem>
        <SelectItem value="url">URL param</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function StorageFieldsPanel({
  entries,
  fields,
  onFieldsChange,
}: {
  entries: StorageEntry[];
  fields: AuthInspectorField[];
  onFieldsChange: (fields: AuthInspectorField[]) => void;
}) {
  const watchedKeys = new Set(fields.map((field) => `${field.area}:${field.key}`));
  const detected = entries.filter((entry) => !watchedKeys.has(`${entry.area}:${entry.key}`));

  function addField(area: StorageArea, key: string) {
    onFieldsChange([...fields, { id: crypto.randomUUID(), area, key, decodeMethod: "none" }]);
  }

  function updateField(id: string, patch: Partial<AuthInspectorField>) {
    onFieldsChange(fields.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  }

  function removeField(id: string) {
    onFieldsChange(fields.filter((field) => field.id !== id));
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <span className="text-sm font-medium">Additional storage fields</span>
      <p className="text-xs text-muted-foreground">
        Watch extra keys from this page&apos;s localStorage, sessionStorage, or URL (query string/hash) and decode each one
        independently — useful for refresh tokens, user profile blobs, feature flags, and the like.
      </p>

      <div className="flex flex-col gap-2">
        {fields.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            No fields added yet. Add one below, or pick from detected keys once you&apos;ve landed back here after logging in.
          </p>
        ) : (
          fields.map((field) => {
            const entry = entries.find((candidate) => candidate.area === field.area && candidate.key === field.key);
            const decoded = entry ? decodeValue(entry.value, field.decodeMethod) : null;
            return (
              <div key={field.id} className="flex flex-col gap-2 rounded-md border p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StorageAreaSelect value={field.area} onChange={(area) => updateField(field.id, { area })} />
                  <Input
                    value={field.key}
                    onChange={(event) => updateField(field.id, { key: event.target.value })}
                    placeholder="key name"
                    className="w-40 font-mono text-xs"
                  />
                  <DecodeSelect value={field.decodeMethod} onChange={(decodeMethod) => updateField(field.id, { decodeMethod })} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => entry && updateField(field.id, { decodeMethod: guessDecodeMethod(entry.value) })}
                    disabled={!entry}
                  >
                    Guess
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeField(field.id)} className="ml-auto">
                    <X />
                  </Button>
                </div>
                {entry ? (
                  decoded?.ok ? (
                    <div className="flex items-start justify-between gap-2 rounded bg-muted/30 p-2 font-mono text-xs break-all whitespace-pre-wrap">
                      <span>{decoded.output}</span>
                      <CopyIconButton value={decoded.output} label={field.key} className="shrink-0" />
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTitle>Couldn&apos;t decode</AlertTitle>
                      <AlertDescription>{decoded?.error}</AlertDescription>
                    </Alert>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">Not found in {AREA_LABEL[field.area]} yet.</span>
                )}
              </div>
            );
          })
        )}
        <Button variant="outline" size="sm" className="self-start" onClick={() => addField("localStorage", "")}>
          <Plus />
          Add field
        </Button>
      </div>

      {detected.length > 0 ? (
        <div className="flex flex-col gap-2 border-t pt-3">
          <span className="text-xs font-medium text-muted-foreground uppercase">Detected keys</span>
          <div className="flex flex-wrap gap-1.5">
            {detected.map((entry) => (
              <Badge
                key={`${entry.area}:${entry.key}`}
                variant="outline"
                className="cursor-pointer font-mono hover:bg-muted"
                onClick={() => addField(entry.area, entry.key)}
              >
                <Plus className="size-3" />
                {entry.key}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
