import Link from "next/link";
import { FaqSection, type FaqItem } from "@/components/seo/faq-section";

const GUIDES_FAQS: FaqItem[] = [
  {
    question: "Do I need to read a guide before using the matching tool?",
    answer:
      "No. Every tool works standalone with no reading required. The guides are there for when you want the reasoning behind an error message or output — why a comma is misplaced, why a signature check failed, why a Base64 string ends in '='.",
  },
  {
    question: "Are these guides beginner tutorials or technical references?",
    answer:
      "Both, by design. Each one starts from first principles but goes deep enough to cover the edge cases and mistakes that trip up experienced developers too — trailing commas, algorithm confusion in JWTs, Base64 alphabet mismatches, and the like.",
  },
  {
    question: "Will more guides be added?",
    answer:
      "Yes. New guides ship alongside new tools, covering the format or protocol each tool works with.",
  },
];

export function GuidesSeoContent() {
  return (
    <section className="flex flex-col gap-8 border-t pt-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Plain-English references, not just API docs</h2>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            The formal specs — RFC 8259 for JSON, RFC 7519 for JWT — define the rules precisely, but rarely explain
            why a particular payload breaks or which signing algorithm actually fits your use case. These guides fill
            that gap: the syntax rules and common errors behind{" "}
            <Link href="/guides/json-formatter-guide" className="underline underline-offset-2">
              JSON
            </Link>
            , the structure and security trade-offs behind{" "}
            <Link href="/guides/jwt-guide" className="underline underline-offset-2">
              JWTs
            </Link>
            , and what's actually happening (and not happening) when you{" "}
            <Link href="/guides/base64-guide" className="underline underline-offset-2">
              Base64-encode
            </Link>{" "}
            something.
          </p>
          <p>
            Each guide links back to its matching tool, so once the concept clicks you can go try it immediately —
            paste a broken payload, decode a real token, or check what a Base64 string decodes to.
          </p>
        </div>
      </div>
      <FaqSection title="Frequently asked questions" items={GUIDES_FAQS} />
    </section>
  );
}
