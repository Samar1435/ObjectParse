import type { Metadata } from "next";
import { ToolGrid } from "@/components/home/tool-grid";
import { HistorySection } from "@/components/home/history-section";
import { HomeSeoContent } from "@/components/home/home-seo-content";
import { SidebarAdLayout } from "@/components/layout/sidebar-ad-layout";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads-config";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site-config";
import { toolsRegistry } from "@/lib/tools-registry";

export const metadata: Metadata = {
  title: "Objectparse — Free Online JSON, JWT & Base64 Tools",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function Home() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: toolsRegistry
      .filter((tool) => tool.status === "available")
      .map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/${tool.slug}`,
        name: tool.title,
      })),
  };

  return (
    <SidebarAdLayout>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Free Online Developer Tools — JSON, JWT & Base64</h1>
        <p className="text-sm text-muted-foreground">
          Everyday developer utilities that run entirely in your browser — nothing you paste here is ever sent to a
          server.
        </p>
      </div>
      <AdSlot variant="leaderboard" slot={AD_SLOTS.leaderboard} />
      <ToolGrid />
      <HistorySection />
      <AdSlot variant="in-content" slot={AD_SLOTS.inContent} />
      <HomeSeoContent />
    </SidebarAdLayout>
  );
}
