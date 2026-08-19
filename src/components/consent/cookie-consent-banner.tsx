"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/store/history-store";

export function CookieConsentBanner() {
  const hydrated = useHistoryStore((state) => state.hydrated);
  const consent = useHistoryStore((state) => state.consent);
  const setConsent = useHistoryStore((state) => state.setConsent);
  const hydrate = useHistoryStore((state) => state.hydrate);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated || consent !== "unknown" || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Cookie className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Allow a local cookie to remember your recent conversions on this device? Nothing ever leaves your
            browser — it just lets us show your recent activity and jump back into a tool with your last input
            prefilled.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConsent("declined");
              setDismissed(true);
            }}
          >
            No thanks
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setConsent("accepted");
              setDismissed(true);
            }}
          >
            Allow history
          </Button>
        </div>
      </div>
    </div>
  );
}
