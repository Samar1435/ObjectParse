"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ADSENSE_CLIENT_ID } from "@/lib/ads-config";

type AdVariant = "leaderboard" | "rectangle" | "sidebar" | "in-content";

const VARIANT_CLASSES: Record<AdVariant, string> = {
  leaderboard: "w-full min-h-24",
  rectangle: "h-[250px] w-[300px]",
  sidebar: "h-[600px] w-[300px]",
  "in-content": "min-h-[250px] w-full",
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Reserves layout space for an ad. Renders a real AdSense unit once
 * NEXT_PUBLIC_ADSENSE_CLIENT_ID and a slot id are configured; otherwise renders
 * a labeled placeholder so the space stays visible and stable (no layout shift
 * when ads are switched on later).
 */
export function AdSlot({ variant, slot, className }: { variant: AdVariant; slot: string; className?: string }) {
  const pushedRef = useRef(false);
  const canRenderAd = Boolean(ADSENSE_CLIENT_ID && slot);

  useEffect(() => {
    if (!canRenderAd || pushedRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // AdSense script blocked or not yet loaded — the reserved space just stays empty.
    }
  }, [canRenderAd]);

  if (canRenderAd) {
    return (
      <ins
        className={cn("adsbygoogle block", VARIANT_CLASSES[variant], className)}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-full-width-responsive="true"
      />
    );
  }

  return (
    <div
      role="presentation"
      className={cn(
        "flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 text-[10px] font-medium tracking-widest text-muted-foreground/60 uppercase",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      Advertisement
    </div>
  );
}
