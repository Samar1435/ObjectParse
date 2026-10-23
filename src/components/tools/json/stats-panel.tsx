"use client";

import { useMemo } from "react";
import { computeStats, type JsonValue } from "@/lib/json";
import { formatBytes } from "@/lib/utils";

export function StatsPanel({ value, rawText }: { value: JsonValue | undefined; rawText: string }) {
  const stats = useMemo(() => (value !== undefined ? computeStats(value, rawText) : null), [value, rawText]);

  if (!stats) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
      <span>{stats.totalNodes} nodes</span>
      <span>{stats.totalKeys} keys</span>
      <span>depth {stats.maxDepth}</span>
      <span>{formatBytes(stats.sizeBytes)}</span>
      <span>{stats.arrayStats.count} arrays</span>
      <span>{stats.typeCounts.object} objects</span>
    </div>
  );
}
