import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import type { FaqItem } from "@/components/seo/faq-section";

export const BASE64_TO_HEX_FAQS: FaqItem[] = [
  {
    question: "Why look at Base64 as hex instead of text?",
    answer:
      "Base64 always decodes to raw bytes, and not every byte sequence is valid text. A hex dump shows every byte exactly as it is — useful for inspecting binary protocol data, cryptographic keys, or debugging why a decoded value looks wrong.",
  },
  {
    question: "What does the offset column in the hex dump mean?",
    answer:
      "It's the byte position of the start of that line, in hex — standard hexdump/xxd-style layout, with 16 bytes per line and an ASCII column on the right for any printable characters.",
  },
  {
    question: "What's the difference between 'Copy plain hex' and the dump view?",
    answer:
      "The dump view is formatted for reading (offsets, spacing, an ASCII gutter) and is truncated for very large input. 'Copy plain hex' copies the full, continuous hex string for every decoded byte, with no formatting — ready to paste into another tool.",
  },
  {
    question: "Can I go from hex back to Base64?",
    answer:
      "Yes — the Hex → Base64 tab accepts hex with or without spaces, colons, or dashes as separators, and encodes it to Base64.",
  },
  {
    question: "Is there a size limit?",
    answer:
      "No hard limit on decoding, but the hex dump view is capped to the first 16 KB for readability and performance; 'Copy plain hex' always copies every byte regardless of what's displayed.",
  },
];

export function Base64ToHexSeoContent() {
  return (
    <ToolSeoContent
      aboutTitle="Base64 to Hex, and back"
      about={
        <>
          <p>
            <strong>Hex</strong> is the most direct way to inspect what Base64 actually decodes to — every byte
            shown as two hex digits, with no assumptions about text encoding. It&apos;s the standard view for
            debugging binary protocols, keys, hashes, and any payload that doesn&apos;t cleanly decode as UTF-8 text.
          </p>
          <p>
            This tool decodes Base64 into a readable hex dump with offsets and an ASCII gutter, and can also build
            Base64 back up from raw hex.
          </p>
        </>
      }
      howToTitle="How to convert Base64 to hex"
      howTo={
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            On the <strong>Base64 → Hex</strong> tab, paste the Base64 string to see a formatted hex dump.
          </li>
          <li>Use &quot;Copy plain hex&quot; for a continuous hex string with no offsets or spacing.</li>
          <li>
            On the <strong>Hex → Base64</strong> tab, paste hex (spaces, colons, and dashes are stripped
            automatically) to get Base64 back.
          </li>
        </ol>
      }
      faqItems={BASE64_TO_HEX_FAQS}
    />
  );
}
