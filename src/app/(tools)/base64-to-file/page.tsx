import type { Metadata } from "next";
import { ToolShell } from "@/components/layout/tool-shell";
import { Base64ToFileTool } from "@/components/tools/base64-to-file/base64-to-file-tool";
import { Base64ToFileSeoContent, BASE64_TO_FILE_FAQS } from "@/components/tools/base64-to-file/seo-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "Base64 to File Converter — Decode to Any File Type";
const DESCRIPTION =
  "Decode a Base64 string into any file type with automatic format detection, or encode any file to Base64 — free, in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "base64 to file",
    "base64 to file converter",
    "decode base64 to file online",
    "file to base64",
    "file to base64 converter",
  ],
  alternates: { canonical: "/base64-to-file" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/base64-to-file" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Base64ToFilePage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Base64 to File Converter — Objectparse",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/base64-to-file`,
    description: DESCRIPTION,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BASE64_TO_FILE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <ToolShell
      currentSlug="base64-to-file"
      title="Base64 to File"
      description={DESCRIPTION}
      seoContent={<Base64ToFileSeoContent />}
    >
      <JsonLd data={softwareAppJsonLd} />
      <JsonLd data={faqJsonLd} />
      <Base64ToFileTool />
    </ToolShell>
  );
}
