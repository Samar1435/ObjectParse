"use client";

import { useCallback, useState } from "react";

export function useClipboard(resetDelayMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetDelayMs);
    },
    [resetDelayMs]
  );

  return { copied, copy };
}
