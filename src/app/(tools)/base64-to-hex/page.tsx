import type { Metadata } from "next";
import { ToolShell } from "@/components/layout/tool-shell";
import { Base64ToHexTool } from "@/components/tools/base64-to-hex/base64-to-hex-tool";
import { Base64ToHexSeoContent, BASE64_TO_HEX_FAQS } from "@/components/tools/base64-to-hex/seo-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "Base64 to Hex Converter (and Hex to Base64)";
const DESCRIPTION =
  "Convert Base64 to a byte-level hex dump for inspection, or build Base64 from raw hex — free, instant, and entirely in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "base64 to hex",
    "base64 to hex converter",
    "base64 hex dump",
    "hex to base64",
    "hex to base64 converter",
  ],
  alternates: { canonical: "/base64-to-hex" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/base64-to-hex" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Base64ToHexPage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Base64 to Hex Converter — Objectparse",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/base64-to-hex`,
    description: DESCRIPTION,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BASE64_TO_HEX_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <ToolShell
      currentSlug="base64-to-hex"
      title="Base64 to Hex"
      description={DESCRIPTION}
      seoContent={<Base64ToHexSeoContent />}
    >
      <JsonLd data={softwareAppJsonLd} />
      <JsonLd data={faqJsonLd} />
      <Base64ToHexTool />
    </ToolShell>
  );
}
