"use client";

import { useMemo } from "react";
import { computeStats, type JsonValue } from "@/lib/json";
import { formatBytes } from "@/lib/utils";

export function StatsPanel({ value, rawText }: { value: JsonValue | undefined; rawText: string }) {
  const stats = useMemo(() => (value !== undefined ? computeStats(value, rawText) : null), [value, rawText]);

  if (!stats) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nothing to analyze yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile label="Total nodes" value={stats.totalNodes} />
        <StatTile label="Total keys" value={stats.totalKeys} />
        <StatTile label="Max depth" value={stats.maxDepth} />
        <StatTile label="Size" value={formatBytes(stats.sizeBytes)} />
        <StatTile label="Arrays" value={stats.arrayStats.count} />
        <StatTile label="Objects" value={stats.typeCounts.object} />
      </div>

      <div>
        <h3 className="mb-1.5 text-xs font-medium text-muted-foreground uppercase">By type</h3>
        <ul className="flex flex-col gap-1">
          {Object.entries(stats.typeCounts).map(([type, count]) => (
            <li key={type} className="flex items-center justify-between">
              <span className="capitalize">{type}</span>
              <span className="text-muted-foreground">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      {stats.arrayStats.count > 0 ? (
        <div>
          <h3 className="mb-1.5 text-xs font-medium text-muted-foreground uppercase">Arrays</h3>
          <p className="text-xs text-muted-foreground">
            {stats.arrayStats.count} array{stats.arrayStats.count === 1 ? "" : "s"}, lengths from{" "}
            {stats.arrayStats.minLength} to {stats.arrayStats.maxLength} (avg {stats.arrayStats.avgLength.toFixed(1)}
            ), {stats.arrayStats.emptyArrayCount} empty.
          </p>
        </div>
      ) : null}

      {stats.duplicateKeys.length > 0 ? (
        <div>
          <h3 className="mb-1.5 text-xs font-medium text-amber-600 uppercase">Duplicate keys</h3>
          <ul className="flex flex-col gap-1">
            {stats.duplicateKeys.map((dup) => (
              <li key={dup.pointer} className="font-mono text-xs">
                {dup.path} — &quot;{dup.key}&quot; appears {dup.occurrences} times
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {stats.numberPrecisionWarnings.length > 0 ? (
        <div>
          <h3 className="mb-1.5 text-xs font-medium text-amber-600 uppercase">Possible precision loss</h3>
          <ul className="flex flex-col gap-1">
            {stats.numberPrecisionWarnings.map((warning) => (
              <li key={warning.pointer} className="font-mono text-xs">
                {warning.path} — {warning.raw}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {stats.hasIntegerLikeKeys ? (
        <p className="text-xs text-muted-foreground">
          This document has numeric-looking object keys — JavaScript always sorts those first, so their order may
          look different from the source.
        </p>
      ) : null}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
