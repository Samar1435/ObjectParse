import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import type { FaqItem } from "@/components/seo/faq-section";

export const BASE64_TO_IMAGE_FAQS: FaqItem[] = [
  {
    question: "Which image formats can this decode?",
    answer:
      "PNG, JPEG, GIF, WebP, BMP, ICO, and SVG are detected automatically from the decoded bytes' own signature — you don't need to tell it which format to expect.",
  },
  {
    question: "How is the format detected without a file extension?",
    answer:
      "Every common image format starts with a distinct magic-byte signature — for example PNG always begins with the same 8 bytes, and JPEG with FF D8 FF. The decoded bytes are checked against these signatures directly, which is the only reliable way to identify a format once it's just a Base64 string.",
  },
  {
    question: "Can I get the image back as a data URI, not just a file?",
    answer:
      "Yes — encoding an image produces a data:image/...;base64,... URI by default (toggle it off for plain Base64), ready to paste directly into CSS or an <img> tag.",
  },
  {
    question: "What if my Base64 doesn't decode to a recognized image?",
    answer:
      "You'll see a notice that the format wasn't recognized, with a link to the more general Base64 to File tool, which downloads any decoded bytes regardless of type.",
  },
  {
    question: "Is the image ever uploaded anywhere?",
    answer:
      "No. Decoding renders the image via a local, in-memory blob URL, and encoding reads the file directly in your browser — nothing is sent to a server.",
  },
];

export function Base64ToImageSeoContent() {
  return (
    <ToolSeoContent
      aboutTitle="Base64 to Image, and back"
      about={
        <>
          <p>
            Images are often carried as <strong>Base64</strong> inside JSON API responses, CSS <code>data:</code>{" "}
            URIs, or email attachments — none of which are viewable until decoded back into actual image bytes.
          </p>
          <p>
            This tool decodes a Base64 string, detects the image format from its byte signature, and renders it
            directly with a download button — no need to know the format in advance. The reverse direction turns an
            uploaded image into Base64 or a ready-to-use data URI.
          </p>
        </>
      }
      howToTitle="How to convert Base64 to an image"
      howTo={
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            On the <strong>Base64 → Image</strong> tab, paste the Base64 string — the format is detected and the
            image renders immediately.
          </li>
          <li>Download the decoded image with one click, using an extension that matches its detected format.</li>
          <li>
            On the <strong>Image → Base64</strong> tab, drop or upload an image to get its Base64 or data URI.
          </li>
        </ol>
      }
      faqItems={BASE64_TO_IMAGE_FAQS}
    />
  );
}
