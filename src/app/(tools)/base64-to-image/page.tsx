import type { Metadata } from "next";
import { ToolShell } from "@/components/layout/tool-shell";
import { Base64ToImageTool } from "@/components/tools/base64-to-image/base64-to-image-tool";
import { Base64ToImageSeoContent, BASE64_TO_IMAGE_FAQS } from "@/components/tools/base64-to-image/seo-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "Base64 to Image Converter (and Image to Base64)";
const DESCRIPTION =
  "Turn a Base64 string into a viewable PNG, JPEG, GIF, WebP, or SVG image, or encode an image to Base64 — free, in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "base64 to image",
    "base64 to image converter",
    "base64 to png",
    "base64 to jpg",
    "image to base64",
    "image to base64 converter",
  ],
  alternates: { canonical: "/base64-to-image" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/base64-to-image" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Base64ToImagePage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Base64 to Image Converter — Objectparse",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/base64-to-image`,
    description: DESCRIPTION,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BASE64_TO_IMAGE_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <ToolShell
      currentSlug="base64-to-image"
      title="Base64 to Image"
      description={DESCRIPTION}
      seoContent={<Base64ToImageSeoContent />}
    >
      <JsonLd data={softwareAppJsonLd} />
      <JsonLd data={faqJsonLd} />
      <Base64ToImageTool />
    </ToolShell>
  );
}
