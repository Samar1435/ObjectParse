import type { Metadata } from "next";
import { ToolShell } from "@/components/layout/tool-shell";
import { Base64Tool } from "@/components/tools/base64/base64-tool";
import { Base64SeoContent, BASE64_TOOL_FAQS } from "@/components/tools/base64/seo-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "Base64 Encoder & Decoder";
const DESCRIPTION = "Encode and decode text or files to and from Base64 online — free, and entirely in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "base64 encode",
    "base64 decode",
    "base64 encode online",
    "base64 decode online",
    "base64 to text",
    "base64 to file",
    "url safe base64",
  ],
  alternates: { canonical: "/base64" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/base64" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Base64Page() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Base64 Encoder & Decoder — Objectparse",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/base64`,
    description: DESCRIPTION,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BASE64_TOOL_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <ToolShell currentSlug="base64" title="Base64" description={DESCRIPTION} seoContent={<Base64SeoContent />}>
      <JsonLd data={softwareAppJsonLd} />
      <JsonLd data={faqJsonLd} />
      <Base64Tool />
    </ToolShell>
  );
}
