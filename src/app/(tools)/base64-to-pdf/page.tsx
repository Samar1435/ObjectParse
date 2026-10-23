import type { Metadata } from "next";
import { ToolShell } from "@/components/layout/tool-shell";
import { Base64ToPdfTool } from "@/components/tools/base64-to-pdf/base64-to-pdf-tool";
import { Base64ToPdfSeoContent, BASE64_TO_PDF_FAQS } from "@/components/tools/base64-to-pdf/seo-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "Base64 to PDF Converter (and PDF to Base64)";
const DESCRIPTION =
  "Turn a Base64 string into a previewable, downloadable PDF, or encode a PDF file to Base64 — free, in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "base64 to pdf",
    "base64 to pdf converter",
    "decode base64 to pdf online",
    "pdf to base64",
    "pdf to base64 converter",
  ],
  alternates: { canonical: "/base64-to-pdf" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/base64-to-pdf" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Base64ToPdfPage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Base64 to PDF Converter — Objectparse",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/base64-to-pdf`,
    description: DESCRIPTION,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BASE64_TO_PDF_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <ToolShell
      currentSlug="base64-to-pdf"
      title="Base64 to PDF"
      description={DESCRIPTION}
      seoContent={<Base64ToPdfSeoContent />}
    >
      <JsonLd data={softwareAppJsonLd} />
      <JsonLd data={faqJsonLd} />
      <Base64ToPdfTool />
    </ToolShell>
  );
}
