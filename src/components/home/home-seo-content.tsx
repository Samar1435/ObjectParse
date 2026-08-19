import Link from "next/link";
import { FaqSection, type FaqItem } from "@/components/seo/faq-section";
import { guidesRegistry } from "@/lib/guides-registry";

const HOME_FAQS: FaqItem[] = [
  {
    question: "Is Objectparse really free?",
    answer:
      "Yes, every tool is free with no account, sign-up, or usage limit. The site is supported by ads shown alongside the tools, not by paywalling features.",
  },
  {
    question: "Do you store or upload what I paste into a tool?",
    answer:
      "No. Every tool — JSON, JWT, and Base64 — runs its formatting, decoding, and validation logic entirely in your browser. The only optional local storage is a small 'recent activity' history, which you explicitly opt into and which never leaves your device.",
  },
  {
    question: "Which developer tools are available right now?",
    answer:
      "A JSON formatter/validator, a JWT decoder/encoder with signature verification, and a Base64 encoder/decoder for text and files. More utilities are on the way.",
  },
];

export function HomeSeoContent() {
  return (
    <section className="flex flex-col gap-8 border-t pt-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Free developer tools that run entirely in your browser</h2>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Objectparse is a growing collection of everyday utilities for working with{" "}
            <Link href="/json" className="underline underline-offset-2">
              JSON
            </Link>
            ,{" "}
            <Link href="/jwt" className="underline underline-offset-2">
              JWTs
            </Link>
            , and{" "}
            <Link href="/base64" className="underline underline-offset-2">
              Base64
            </Link>
            . Every tool is free, works offline once loaded, and never sends what you paste to a server — the
            formatting, parsing, decoding, and signature verification all happen locally, in your own browser.
          </p>
          <p>
            Want the background on how these formats actually work? Read the guides:{" "}
            {guidesRegistry.map((guide, index) => (
              <span key={guide.slug}>
                <Link href={`/guides/${guide.slug}`} className="underline underline-offset-2">
                  {guide.navTitle}
                </Link>
                {index < guidesRegistry.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      </div>
      <FaqSection title="Frequently asked questions" items={HOME_FAQS} />
    </section>
  );
}
