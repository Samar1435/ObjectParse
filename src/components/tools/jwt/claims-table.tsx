"use client";

import { useMemo, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CopyIconButton } from "@/components/tools/jwt/copy-icon-button";
import { useClipboard } from "@/hooks/use-clipboard";
import { cn } from "@/lib/utils";
import type { ClaimInfo } from "@/lib/jwt";

function highlightMatches(text: string, needle: string): ReactNode {
  if (!needle) return text;
  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const index = lowerText.indexOf(lowerNeedle);
  if (index === -1) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = index;
  let key = 0;
  while (matchIndex !== -1) {
    if (matchIndex > cursor) parts.push(text.slice(cursor, matchIndex));
    parts.push(
      <mark key={key++} className="rounded bg-yellow-300/70 px-0.5 text-foreground dark:bg-yellow-500/40">
        {text.slice(matchIndex, matchIndex + needle.length)}
      </mark>
    );
    cursor = matchIndex + needle.length;
    matchIndex = lowerText.indexOf(lowerNeedle, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function ClaimKeyBadge({ claimKey, description, needle }: { claimKey: string; description?: string; needle: string }) {
  const { copied, copy } = useClipboard();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => copy(claimKey)}
          className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground transition-colors hover:bg-muted-foreground/20"
        >
          {highlightMatches(claimKey, needle)}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? "Copied!" : description ? `Copy “${claimKey}” — ${description}` : `Copy “${claimKey}”`}
      </TooltipContent>
    </Tooltip>
  );
}

export function ClaimsTable({
  title,
  accentClassName,
  entries,
  searchTerm,
}: {
  title: string;
  accentClassName: string;
  entries: ClaimInfo[];
  searchTerm: string;
}) {
  const needle = searchTerm.trim();

  const filtered = useMemo(() => {
    if (!needle) return entries;
    const lowerNeedle = needle.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.key.toLowerCase().includes(lowerNeedle) ||
        entry.display.toLowerCase().includes(lowerNeedle) ||
        entry.description?.toLowerCase().includes(lowerNeedle)
    );
  }, [entries, needle]);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className={cn("text-xs font-medium uppercase", accentClassName)}>{title}</span>
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
          No {title.toLowerCase()} claims match “{needle}”.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {filtered.map((entry) => (
            <li key={entry.key} className="group flex items-start justify-between gap-3 px-3 py-2 text-sm hover:bg-muted/40">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <ClaimKeyBadge claimKey={entry.key} description={entry.description} needle={needle} />
                  {entry.description ? <span className="text-[11px] text-muted-foreground">{entry.description}</span> : null}
                </div>
                <span className="break-all">{highlightMatches(entry.display, needle)}</span>
              </div>
              <CopyIconButton
                value={entry.copyValue}
                label={`${entry.key} value`}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
