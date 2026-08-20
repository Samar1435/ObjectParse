"use client";

import { useMemo, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_SUGGESTIONS = 8;

export function ClaimsSearchBox({
  value,
  onChange,
  suggestions,
  sticky,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  sticky?: boolean;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const needle = value.trim().toLowerCase();
    if (!needle) return [];
    return suggestions
      .filter((suggestion) => suggestion.toLowerCase() !== needle && suggestion.toLowerCase().includes(needle))
      .slice(0, MAX_SUGGESTIONS);
  }, [value, suggestions]);

  const showDropdown = focused && filteredSuggestions.length > 0;

  return (
    <div
      className={cn(
        "relative w-full max-w-sm",
        sticky ? "sticky top-0 z-10 bg-background py-1.5" : null,
        className
      )}
    >
      <div className="absolute -inset-0.5 rounded-xl bg-ring/10 blur-sm dark:bg-ring/20 -z-10" />
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search claims by key or value…"
        className="pl-8 pr-8 shadow-[0_0_0_1px_rgba(var(--ring)/0.15)] focus-visible:shadow-[0_0_6px_rgba(var(--ring)/0.25)]"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear search"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => onChange("")}
        >
          <X />
        </Button>
      ) : null}
      {showDropdown ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover py-1 shadow-md">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-muted"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
