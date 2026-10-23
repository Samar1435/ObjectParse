import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import type { FaqItem } from "@/components/seo/faq-section";

export const BASE64_TO_PDF_FAQS: FaqItem[] = [
  {
    question: "How does this know decoded bytes are a PDF?",
    answer:
      "Every PDF file starts with the same five-byte signature, %PDF-, followed by a version number. The decoded bytes are checked for that signature directly, rather than trusting a file extension that Base64 never carries.",
  },
  {
    question: "Can I view the PDF before downloading it?",
    answer:
      "Yes — a recognized PDF renders inline using the browser's own PDF viewer, so you can scroll and read it before deciding to download.",
  },
  {
    question: "Can I upload a PDF and get Base64 back?",
    answer: "Yes — the PDF → Base64 tab reads an uploaded PDF and produces its Base64 (optionally URL-safe).",
  },
  {
    question: "Why would a PDF be Base64-encoded in the first place?",
    answer:
      "APIs and message queues that only carry text often embed generated PDFs — invoices, reports, signed documents — as a Base64 field in a JSON payload.",
  },
  {
    question: "Is the PDF uploaded anywhere?",
    answer: "No. Both directions run entirely in your browser using local blob URLs — nothing leaves your machine.",
  },
];

export function Base64ToPdfSeoContent() {
  return (
    <ToolSeoContent
      aboutTitle="Base64 to PDF, and back"
      about={
        <>
          <p>
            APIs that generate documents — invoices, receipts, signed contracts — often return the{" "}
            <strong>PDF as a Base64 string</strong> embedded in a JSON response, since PDFs are binary and many
            transport layers only handle text cleanly.
          </p>
          <p>
            This tool decodes that Base64, confirms it&apos;s actually a PDF by its byte signature, and renders it inline
            for a quick look before you download it. The reverse direction encodes an uploaded PDF back to Base64.
          </p>
        </>
      }
      howToTitle="How to convert Base64 to a PDF"
      howTo={
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            On the <strong>Base64 → PDF</strong> tab, paste the Base64 string — a valid PDF renders immediately.
          </li>
          <li>Download the decoded file with one click.</li>
          <li>
            On the <strong>PDF → Base64</strong> tab, drop or upload a PDF to get its Base64 output.
          </li>
        </ol>
      }
      faqItems={BASE64_TO_PDF_FAQS}
    />
  );
}
