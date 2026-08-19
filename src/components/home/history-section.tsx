"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { History as HistoryIcon, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toolsRegistry } from "@/lib/tools-registry";
import { dayLabel, formatRelativeTime, HISTORY_RETENTION_DAYS, type HistoryEntry } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";

export function HistorySection() {
  const hydrated = useHistoryStore((state) => state.hydrated);
  const consent = useHistoryStore((state) => state.consent);
  const entries = useHistoryStore((state) => state.entries);
  const removeEntry = useHistoryStore((state) => state.removeEntry);
  const clear = useHistoryStore((state) => state.clear);
  const restore = useHistoryStore((state) => state.restore);
  const setConsent = useHistoryStore((state) => state.setConsent);
  const hydrate = useHistoryStore((state) => state.hydrate);
  const router = useRouter();
  const [now] = useState(() => Date.now());

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const recent = useMemo(() => {
    const cutoff = now - HISTORY_RETENTION_DAYS * 86_400_000;
    return entries.filter((entry) => entry.createdAt >= cutoff);
  }, [entries, now]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of recent) {
      const label = dayLabel(entry.createdAt, now);
      const bucket = map.get(label);
      if (bucket) bucket.push(entry);
      else map.set(label, [entry]);
    }
    return Array.from(map.entries());
  }, [recent, now]);

  if (!hydrated || consent === "unknown") return null;

  function handleOpen(entry: HistoryEntry) {
    restore(entry.payload);
    router.push(`/${entry.tool}`);
  }

  if (consent === "declined") {
    return (
      <Card className="flex flex-row items-center justify-between gap-2 p-4 text-sm text-muted-foreground">
        <span>Recent activity history is turned off.</span>
        <Button variant="outline" size="sm" onClick={() => setConsent("accepted")}>
          Turn on
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground">Recent activity</h2>
        </div>
        {recent.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 />
            Clear
          </Button>
        ) : null}
      </div>

      {recent.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">
          Nothing yet — conversions you run will show up here for the last {HISTORY_RETENTION_DAYS} days.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([label, group]) => (
            <div key={label} className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
              <div className="flex flex-col gap-1.5">
                {group.map((entry) => {
                  const tool = toolsRegistry.find((t) => t.slug === entry.tool);
                  const Icon = tool?.icon;
                  return (
                    <div
                      key={entry.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpen(entry)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") handleOpen(entry);
                      }}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        {Icon ? <Icon className="size-4" /> : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{entry.label}</span>
                        <span className="truncate font-mono text-xs text-muted-foreground">{entry.preview}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(entry.createdAt, now)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove from history"
                        className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeEntry(entry.id);
                        }}
                      >
                        <X />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
