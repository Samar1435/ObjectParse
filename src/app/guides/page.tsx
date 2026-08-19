import type { Metadata } from "next";
import { SidebarAdLayout } from "@/components/layout/sidebar-ad-layout";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads-config";
import { GuideCard } from "@/components/guides/guide-card";
import { guidesRegistry } from "@/lib/guides-registry";

const TITLE = "Developer Guides";
const DESCRIPTION =
  "Plain-English explanations of JSON, JWTs, and Base64 — how each format actually works, common mistakes, and when to use them.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guides" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/guides" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function GuidesIndexPage() {
  return (
    <SidebarAdLayout>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{TITLE}</h1>
        <p className="text-sm text-muted-foreground">{DESCRIPTION}</p>
      </div>
      <AdSlot variant="leaderboard" slot={AD_SLOTS.leaderboard} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guidesRegistry.map((guide) => (
          <GuideCard key={guide.slug} guide={guide} />
        ))}
      </div>
    </SidebarAdLayout>
  );
}
