import type { Metadata } from "next";
import { ToolShell } from "@/components/layout/tool-shell";
import { JwtTool } from "@/components/tools/jwt/jwt-tool";
import { JwtSeoContent, JWT_TOOL_FAQS } from "@/components/tools/jwt/seo-content";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "JWT Decoder, Encoder & Signature Verifier";
const DESCRIPTION =
  "Decode, encode, and verify JSON Web Tokens online — HMAC, RSA, and ECDSA. Free, and entirely in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "jwt decoder",
    "jwt debugger",
    "decode jwt online",
    "jwt verify signature",
    "jwt encoder",
    "json web token decoder",
  ],
  alternates: { canonical: "/jwt" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/jwt" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function JwtPage() {
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "JWT Decoder & Encoder — Objectparse",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (runs in browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/jwt`,
    description: DESCRIPTION,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: JWT_TOOL_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <ToolShell currentSlug="jwt" title="JWT" description={DESCRIPTION} seoContent={<JwtSeoContent />}>
      <JsonLd data={softwareAppJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JwtTool />
    </ToolShell>
  );
}
