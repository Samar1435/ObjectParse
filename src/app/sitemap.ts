import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { toolsRegistry } from "@/lib/tools-registry";
import { guidesRegistry } from "@/lib/guides-registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const toolEntries: MetadataRoute.Sitemap = toolsRegistry
    .filter((tool) => tool.status === "available")
    .map((tool) => ({
      url: `${SITE_URL}/${tool.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  const guideEntries: MetadataRoute.Sitemap = guidesRegistry.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/guides`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    ...toolEntries,
    ...guideEntries,
  ];
}
