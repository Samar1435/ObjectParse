import type { Metadata } from "next";
import { ToolShell } from "@/components/layout/tool-shell";
import { JsonTool } from "@/components/tools/json/json-tool";
import { JsonSeoContent, JSON_TOOL_FAQS } from "@/components/tools/json/seo-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "JSON Formatter, Validator & Repair Tool";
const DESCRIPTION =
  "Format, validate, auto-repair, search, and inspect JSON online — free, with precise line and column error locations. Runs entirely in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "json formatter",
    "json validator",
    "json parser online",
    "json beautifier",
    "json lint",
    "fix invalid json",
  ],
  alternates: { canonical: "/json" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/json" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function JsonPage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "JSON Formatter & Validator — Objectparse",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/json`,
    description: DESCRIPTION,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: JSON_TOOL_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <ToolShell currentSlug="json" title="JSON" description={DESCRIPTION} seoContent={<JsonSeoContent />}>
      <JsonLd data={softwareAppJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonTool />
    </ToolShell>
  );
}
