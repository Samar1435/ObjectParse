"use client";

import { AlertTriangle, CircleAlert, PartyPopper } from "lucide-react";
import type { JsonDiagnostic } from "@/lib/json";

export function ErrorsList({
  diagnostics,
  onJump,
}: {
  diagnostics: JsonDiagnostic[];
  onJump: (diagnostic: JsonDiagnostic) => void;
}) {
  if (diagnostics.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <PartyPopper className="size-5" />
        No errors — this is valid JSON.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {diagnostics.map((diagnostic, index) => (
        <li key={`${diagnostic.offset}-${index}`}>
          <button
            type="button"
            onClick={() => onJump(diagnostic)}
            className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            {diagnostic.severity === "error" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            )}
            <span className="flex flex-col">
              <span>{diagnostic.message}</span>
              <span className="text-xs text-muted-foreground">
                Line {diagnostic.range.start.line}, column {diagnostic.range.start.column}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
