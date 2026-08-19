import Link from "next/link";
import { Braces } from "lucide-react";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads-config";
import { toolsRegistry } from "@/lib/tools-registry";
import { guidesRegistry } from "@/lib/guides-registry";

export function SiteFooter() {
  const tools = toolsRegistry.filter((tool) => tool.status === "available");

  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <AdSlot variant="leaderboard" slot={AD_SLOTS.leaderboard} className="mx-auto" />
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Braces className="size-5" />
              Objectparse
            </Link>
            <p className="text-sm text-muted-foreground">
              Free browser-based developer utilities. Nothing you paste is ever uploaded — every tool runs entirely
              on your device.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Tools</span>
            {tools.map((tool) => (
              <Link key={tool.slug} href={`/${tool.slug}`} className="text-muted-foreground hover:text-foreground">
                {tool.title}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Guides</span>
            {guidesRegistry.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="text-muted-foreground hover:text-foreground"
              >
                {guide.navTitle}
              </Link>
            ))}
            <Link href="/guides" className="text-muted-foreground hover:text-foreground">
              All guides
            </Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Objectparse. All processing happens locally in your browser.
        </p>
      </div>
    </footer>
  );
}
