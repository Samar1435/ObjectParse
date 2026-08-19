"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { JsonValue, Range, SearchMatch, SearchMode } from "@/lib/json";

/** A search match enriched with its resolved editor position, computed once per search run. */
export interface SearchMatchWithRange extends SearchMatch {
  range: Range | null;
}

export interface SearchResultWithRanges {
  matches: SearchMatchWithRange[];
  truncated: boolean;
  scanned: number;
  elapsedMs: number;
}

export function matchKey(match: SearchMatch): string {
  return `${match.pointer}::${match.matchedIn}`;
}

function typeOfMatchValue(value: JsonValue): string {
  if (value === null) return "null";
  return Array.isArray(value) ? "array" : typeof value;
}

export function SearchPanel({
  hasValue,
  term,
  mode,
  onModeChange,
  matchCase,
  onMatchCaseChange,
  result,
  activeKey,
  onJump,
}: {
  hasValue: boolean;
  term: string;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  matchCase: boolean;
  onMatchCaseChange: (matchCase: boolean) => void;
  result: SearchResultWithRanges | null;
  activeKey: string | null;
  onJump: (match: SearchMatchWithRange) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{term.trim() ? `Results for “${term.trim()}”` : "Search"}</span>
        <Select value={mode} onValueChange={(next) => onModeChange(next as SearchMode)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Keys &amp; values</SelectItem>
            <SelectItem value="key">Keys only</SelectItem>
            <SelectItem value="value">Values only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox checked={matchCase} onCheckedChange={(checked) => onMatchCaseChange(checked === true)} />
        Match case
      </label>

      {!hasValue ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nothing to search yet.</p>
      ) : !term.trim() ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Type in the search box above to filter this document.
        </p>
      ) : result && result.matches.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            {result.matches.length} match{result.matches.length === 1 ? "" : "es"}
            {result.truncated ? " (showing first batch)" : ""} — scanned {result.scanned} nodes in{" "}
            {result.elapsedMs}ms
          </p>
          <ul className="flex flex-col gap-1">
            {result.matches.map((match) => {
              const key = matchKey(match);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => onJump(match)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                      activeKey === key && "bg-muted ring-1 ring-yellow-500/70"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs text-muted-foreground">{match.path}</span>
                      {match.range ? (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          Line {match.range.start.line}:{match.range.start.column}
                        </span>
                      ) : null}
                    </div>
                    <span className="truncate">
                      <mark className="rounded bg-yellow-300/70 px-0.5 text-foreground dark:bg-yellow-500/40">
                        {match.preview}
                      </mark>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      matched in {match.matchedIn}
                      {match.matchedIn === "value" ? ` · ${typeOfMatchValue(match.value)}` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">No matches.</p>
      )}
    </div>
  );
}
