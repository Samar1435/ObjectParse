import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import type { FaqItem } from "@/components/seo/faq-section";

export const BASE64_TOOL_FAQS: FaqItem[] = [
  {
    question: "What's the difference between standard and URL-safe Base64?",
    answer:
      "Standard Base64 uses + and / in its alphabet, which have special meaning in URLs and file paths. URL-safe Base64 swaps those for - and _ so the output can be used directly in a URL, filename, or query string without extra encoding.",
  },
  {
    question: "Can I encode or decode files, not just text?",
    answer:
      "Yes. Drop a file onto the encode panel (or use the upload button) to get its Base64 representation, and the decoder automatically detects and offers a download when the decoded output is binary rather than text.",
  },
  {
    question: "Why does my Base64 string end with = or ==?",
    answer:
      "That's padding. Base64 encodes 3 bytes into 4 characters; when the input length isn't a multiple of 3, one or two '=' characters pad the final group so the output length stays a multiple of 4.",
  },
  {
    question: "Is Base64 a form of encryption?",
    answer:
      "No — Base64 is an encoding, not encryption. It has no secret key and provides zero confidentiality; anyone can decode it instantly. Use it to represent binary data as text, never to protect sensitive information.",
  },
  {
    question: "Can I go straight from Base64 to formatted JSON?",
    answer:
      "Yes. When decoded text looks like JSON, it appears right below the output already parsed and pretty-printed in an embedded copy of the JSON tool.",
  },
];

export function Base64SeoContent() {
  return (
    <ToolSeoContent
      aboutTitle="What is Base64 encoding?"
      about={
        <>
          <p>
            <strong>Base64</strong> converts binary data into a 64-character text alphabet (A–Z, a–z, 0–9, + and /)
            so it can safely travel through systems built for text — JSON payloads, email (MIME), data URIs in
            HTML/CSS, and HTTP headers. It&apos;s an encoding scheme, not compression or encryption: the output is always
            about 33% larger than the input, and it can be reversed by anyone.
          </p>
          <p>
            Typical uses include embedding small images directly in CSS with <code>data:</code> URIs, sending
            binary attachments over text-only protocols, and encoding the header/payload segments of a{" "}
            <code>JWT</code>.
          </p>
        </>
      }
      howToTitle="How to encode and decode Base64 online"
      howTo={
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            On the <strong>Encode</strong> tab, paste text or drop a file — the Base64 output updates instantly.
          </li>
          <li>Check &quot;URL-safe&quot; if the result needs to go into a URL, filename, or query parameter.</li>
          <li>
            On the <strong>Decode</strong> tab, paste a Base64 string — the alphabet (standard vs. URL-safe) is
            detected automatically.
          </li>
          <li>Text output can be copied directly; binary output offers a one-click file download.</li>
        </ol>
      }
      faqItems={BASE64_TOOL_FAQS}
    />
  );
}
