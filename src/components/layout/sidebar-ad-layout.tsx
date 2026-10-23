import type { ReactNode } from "react";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads-config";

/**
 * Shared page shell: a centered main column plus a sticky ad rail that only
 * appears on xl+ screens. When the rail is hidden, `justify-center` keeps the
 * single remaining column centered exactly like a plain max-w-5xl page.
 */
export function SidebarAdLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 justify-center gap-6 p-4 sm:p-6">
      {/* min-w-0: without it, a flex item defaults to an "automatic minimum size" equal to its
          content's intrinsic width — so a long unbroken string anywhere inside (e.g. a search
          match preview) would stop this column from shrinking, pushing the ad rail sideways. */}
      <div className="flex w-full max-w-5xl min-w-0 flex-1 flex-col gap-4">{children}</div>
      <aside className="hidden w-[300px] shrink-0 xl:block">
        <div className="ad-zone sticky top-20 flex flex-col gap-4">
          <AdSlot variant="sidebar" slot={AD_SLOTS.sidebar} />
          <AdSlot variant="rectangle" slot={AD_SLOTS.rectangle} />
        </div>
      </aside>
    </div>
  );
}
