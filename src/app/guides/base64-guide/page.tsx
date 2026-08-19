import type { Metadata } from "next";
import { GuideShell } from "@/components/layout/guide-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "Base64 Encoding Explained: How It Works & When to Use It";
const DESCRIPTION = "What Base64 actually does, why it isn't encryption, and where it shows up in data URIs, emails, and APIs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["what is base64", "base64 alphabet", "base64 padding", "base64 data uri", "base64 vs encryption"],
  alternates: { canonical: "/guides/base64-guide" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/guides/base64-guide", type: "article" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Base64GuidePage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/guides/base64-guide`,
    author: { "@type": "Organization", name: "Objectparse" },
  };

  return (
    <GuideShell title={TITLE} description={DESCRIPTION} relatedToolSlug="base64" relatedToolTitle="Base64">
      <JsonLd data={articleJsonLd} />
      <p>
        Lots of systems — email, JSON, URLs, HTTP headers — were designed to carry text, not arbitrary binary data.
        Base64 exists to bridge that gap: it re-represents any sequence of bytes as plain, printable text that those
        text-only systems can carry safely.
      </p>

      <h2>How the Base64 alphabet works</h2>
      <p>
        Base64 uses a 64-character alphabet (A–Z, a–z, 0–9, plus two more symbols) where each character represents
        exactly 6 bits. Since 3 bytes = 24 bits = exactly four 6-bit groups, Base64 processes input 3 bytes at a
        time and emits 4 characters per group. When the input isn&apos;t a multiple of 3 bytes, one or two{" "}
        <code>=</code> padding characters fill out the final group so the output length always stays a multiple of
        4.
      </p>
      <p>
        This is also why Base64 output is always about <strong>33% larger</strong> than the original binary — 3
        bytes become 4 characters, an overhead you should account for whenever you consider Base64-encoding large
        files.
      </p>

      <h2>Standard vs. URL-safe Base64</h2>
      <p>
        The standard alphabet&apos;s last two characters are <code>+</code> and <code>/</code> — both of which have
        reserved meaning inside a URL. <strong>URL-safe Base64</strong> swaps them for <code>-</code> and{" "}
        <code>_</code> so the encoded text can be dropped directly into a URL path, query string, or filename
        without additional percent-encoding. JWTs specifically use URL-safe Base64 (without padding) for exactly
        this reason.
      </p>

      <h2>Where Base64 actually shows up</h2>
      <ul>
        <li>
          <strong>Data URIs</strong> — embedding a small image directly in HTML/CSS with{" "}
          <code>data:image/png;base64,...</code>, avoiding an extra network request.
        </li>
        <li>
          <strong>Email attachments (MIME)</strong> — email was originally a 7-bit text protocol, so binary
          attachments are Base64-encoded to travel safely.
        </li>
        <li>
          <strong>HTTP Basic Auth</strong> — the <code>Authorization: Basic ...</code> header is just{" "}
          <code>username:password</code> Base64-encoded (not encrypted — this only works safely over HTTPS).
        </li>
        <li>
          <strong>JWTs</strong> — the header and payload segments of a JSON Web Token are URL-safe Base64-encoded
          JSON.
        </li>
        <li>Embedding small binary blobs (thumbnails, keys, tokens) inside a JSON payload.</li>
      </ul>

      <h2>Base64 is not encryption</h2>
      <p>
        This is the single most common misunderstanding about Base64: it provides <strong>zero confidentiality</strong>.
        There&apos;s no key involved — anyone can decode a Base64 string instantly, by hand if necessary. If you need to
        protect data, encrypt it first and Base64-encode the ciphertext afterward if it still needs to travel as
        text; never rely on Base64 alone to hide sensitive information.
      </p>
    </GuideShell>
  );
}
