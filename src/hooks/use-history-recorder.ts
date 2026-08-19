"use client";

import { useEffect, useRef, useState } from "react";
import { useHistoryStore } from "@/store/history-store";
import type { HistoryPayload, ToolSlug } from "@/lib/history";

interface HistoryEntryDraft {
  tool: ToolSlug;
  label: string;
  preview: string;
  payload: HistoryPayload;
}

/**
 * Debounces a builder into a single upserted history entry per component lifetime, so a
 * paused-typing session reads as one "last thing you did" record rather than one per pause.
 */
export function useHistoryRecorder(build: () => HistoryEntryDraft | null, deps: unknown[], delay = 900): void {
  const record = useHistoryStore((state) => state.record);
  const [sessionId] = useState(() => crypto.randomUUID());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buildRef = useRef(build);

  useEffect(() => {
    buildRef.current = build;
  });

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const draft = buildRef.current();
      if (draft) record({ id: sessionId, ...draft });
    }, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Navigating away (or switching tabs, which unmounts the inactive panel) cancels the
  // debounce above before it ever fires — flush the latest draft immediately so a quick
  // paste-then-navigate isn't silently dropped.
  useEffect(() => {
    return () => {
      const draft = buildRef.current();
      if (draft) record({ id: sessionId, ...draft });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
