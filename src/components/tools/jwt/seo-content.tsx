import { ToolSeoContent } from "@/components/seo/tool-seo-content";
import type { FaqItem } from "@/components/seo/faq-section";

export const JWT_TOOL_FAQS: FaqItem[] = [
  {
    question: "Is it safe to paste a production JWT into this decoder?",
    answer:
      "Decoding and verification both run entirely in your browser — the token, secret, and any keys you enter are never sent to a server. Still, treat tokens like credentials: avoid pasting production tokens on a shared or public computer.",
  },
  {
    question: "Which signing algorithms does the verifier support?",
    answer:
      "HMAC (HS256, HS384, HS512) with a shared secret, RSA (RS256, RS384, RS512) with a public/private key pair, and ECDSA (ES256, ES384, ES512) with an EC key pair.",
  },
  {
    question: "Can anyone read the contents of a JWT without the secret?",
    answer:
      "Yes. The header and payload are only Base64URL-encoded, not encrypted — anyone can decode them. The signature doesn't hide the data, it only proves the token wasn't tampered with (assuming the signing key stays private).",
  },
  {
    question: "Why does my token say it's expired?",
    answer:
      "The 'exp' claim is a Unix timestamp for when the token stops being valid. This tool checks it against your current clock and flags the token as expired the moment that time has passed, even if the signature is still valid.",
  },
  {
    question: "Can I create a new JWT, not just decode one?",
    answer:
      "Yes — switch to the Encode tab to build a header and payload, pick an algorithm, provide a secret or private key, and get a signed token back.",
  },
];

export function JwtSeoContent() {
  return (
    <ToolSeoContent
      aboutTitle="What is a JWT (JSON Web Token)?"
      about={
        <>
          <p>
            A <strong>JSON Web Token</strong> is a compact, URL-safe token format made of three Base64URL-encoded
            parts separated by dots: <code>header.payload.signature</code>. The header names the signing algorithm,
            the payload carries claims like <code>sub</code>, <code>iat</code>, <code>exp</code>, and{" "}
            <code>aud</code>, and the signature lets a server verify the token wasn&apos;t modified after it was issued.
          </p>
          <p>
            JWTs are the backbone of most modern session and API authentication — this decoder breaks a token apart,
            shows every claim in a searchable table, and can verify the signature against your own secret or key.
          </p>
        </>
      }
      howToTitle="How to decode and verify a JWT"
      howTo={
        <ol className="list-decimal space-y-2 pl-5">
          <li>Paste a token into the Decode tab — the header, payload, and signature are colorized separately.</li>
          <li>
            Browse claims in the <strong>Claims</strong> table or switch to <strong>Raw JSON</strong> to see the
            header and payload exactly as issued.
          </li>
          <li>
            To check the signature, pick the algorithm the token was signed with, paste the matching secret or
            public key, and click <strong>Verify signature</strong>.
          </li>
          <li>Use the Encode tab to build and sign a brand-new token from scratch.</li>
        </ol>
      }
      faqItems={JWT_TOOL_FAQS}
    />
  );
}
