import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import type { FaqItem } from "@/components/seo/faq-section";

export const BASE64_TO_FILE_FAQS: FaqItem[] = [
  {
    question: "How does this figure out the file type without an extension?",
    answer:
      "Common binary formats (PNG, JPEG, GIF, WebP, BMP, ICO, PDF, ZIP, GZIP, MP4, WAV, MP3) are detected from their own magic-byte signature. If none match, the bytes are checked for valid UTF-8 text, and then for JSON or SVG shape, before falling back to a generic binary download.",
  },
  {
    question: "Can I rename the file before downloading?",
    answer: "Yes — edit the file name field next to the Download button; it starts pre-filled with a detected extension.",
  },
  {
    question: "What if the format isn't recognized at all?",
    answer:
      "It still downloads as raw bytes with a .bin extension and an 'Unknown binary data' label — nothing is lost, it just won't get a type-specific preview.",
  },
  {
    question: "Is there a dedicated tool for images or PDFs specifically?",
    answer:
      "Yes — Base64 to Image and Base64 to PDF give a larger, type-focused preview for those two formats specifically. This tool is the general-purpose fallback for anything else.",
  },
  {
    question: "Can I encode any file to Base64 here too?",
    answer: "Yes — the File → Base64 tab accepts any file by drag-and-drop or upload, with an optional URL-safe alphabet.",
  },
];

export function Base64ToFileSeoContent() {
  return (
    <ToolSeoContent
      aboutTitle="Base64 to any file, and back"
      about={
        <>
          <p>
            A Base64 string carries no metadata about what it decodes to — no extension, no MIME type. This tool
            decodes the bytes and identifies the format from its own <strong>magic-byte signature</strong>, then
            offers a type-aware preview (image, PDF, or text) alongside a download with a sensible file name.
          </p>
          <p>
            It&apos;s the general-purpose counterpart to the dedicated Base64 to Image and Base64 to PDF tools —
            useful when you don&apos;t know in advance what the Base64 actually contains.
          </p>
        </>
      }
      howToTitle="How to convert Base64 to a file"
      howTo={
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            On the <strong>Base64 → File</strong> tab, paste the Base64 string — the format is detected
            automatically.
          </li>
          <li>Adjust the file name if needed, then download.</li>
          <li>
            On the <strong>File → Base64</strong> tab, drop or upload any file to get its Base64 output.
          </li>
        </ol>
      }
      faqItems={BASE64_TO_FILE_FAQS}
    />
  );
}
