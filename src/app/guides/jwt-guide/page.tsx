import type { Metadata } from "next";
import { GuideShell } from "@/components/layout/guide-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "Understanding JWTs: Structure, Signing Algorithms & Security";
const DESCRIPTION =
  "How a JSON Web Token is built, the difference between HMAC, RSA, and ECDSA signing, and common JWT security mistakes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["jwt structure", "jwt claims", "hmac vs rsa jwt", "jwt security", "jwt best practices"],
  alternates: { canonical: "/guides/jwt-guide" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/guides/jwt-guide", type: "article" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function JwtGuidePage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/guides/jwt-guide`,
    author: { "@type": "Organization", name: "Objectparse" },
  };

  return (
    <GuideShell title={TITLE} description={DESCRIPTION} relatedToolSlug="jwt" relatedToolTitle="JWT">
      <JsonLd data={articleJsonLd} />
      <p>
        A JSON Web Token (JWT, defined in RFC 7519) is a compact way to pass a signed set of claims between two
        parties — most commonly a client and an API, as proof that the bearer already authenticated. It&apos;s the
        default building block behind most modern session and API auth flows.
      </p>

      <h2>Anatomy of a JWT</h2>
      <p>
        A JWT is three Base64URL-encoded segments joined by dots: <code>header.payload.signature</code>.
      </p>
      <ul>
        <li>
          <strong>Header</strong> — a small JSON object naming the signing algorithm and token type, e.g.{" "}
          <code>{"{\"alg\":\"HS256\",\"typ\":\"JWT\"}"}</code>.
        </li>
        <li>
          <strong>Payload</strong> — the claims: arbitrary data plus a set of registered fields like <code>sub</code>{" "}
          (subject), <code>iss</code> (issuer), <code>aud</code> (audience), <code>iat</code> (issued at),{" "}
          <code>exp</code> (expiry), and <code>nbf</code> (not valid before).
        </li>
        <li>
          <strong>Signature</strong> — computed over the header and payload using the algorithm from the header and
          a secret or private key. It proves the token wasn&apos;t altered after issuance.
        </li>
      </ul>
      <p>
        Crucially, the header and payload are only <em>encoded</em>, not encrypted. Anyone can decode and read them
        without any key — the signature only protects integrity, not confidentiality. Never put secrets you don&apos;t
        want the token holder to read directly into the payload.
      </p>

      <h2>HMAC vs. RSA vs. ECDSA signing</h2>
      <p>
        <strong>HMAC</strong> (HS256/384/512) is symmetric: the same secret both signs and verifies the token. It&apos;s
        fast and simple, but every service that needs to verify tokens must also hold the secret — which means every
        one of them could also forge tokens.
      </p>
      <p>
        <strong>RSA</strong> (RS256/384/512) and <strong>ECDSA</strong> (ES256/384/512) are asymmetric: a private key
        signs, and a separate public key verifies. This is the right choice whenever multiple independent services
        need to verify tokens issued by one authority — each service only needs the public key, which is safe to
        distribute. ECDSA produces shorter signatures than RSA at an equivalent security level, at the cost of being
        slightly less universally supported.
      </p>

      <h2>Common JWT security mistakes</h2>
      <ul>
        <li>
          <strong>Trusting the decoded payload without verifying the signature.</strong> Decoding is not the same as
          validating — always verify server-side before trusting any claim.
        </li>
        <li>
          <strong>Accepting <code>{'"alg": "none"'}</code> or letting the client choose the algorithm.</strong> A server
          should pin the expected algorithm rather than trusting whatever the token header claims.
        </li>
        <li>
          <strong>Storing tokens in <code>localStorage</code></strong> makes them readable by any script on the page
          — vulnerable to XSS. An httpOnly, secure cookie is generally safer for browser-based apps.
        </li>
        <li>
          <strong>Long-lived access tokens with no revocation path.</strong> Short expirations paired with a
          refresh-token flow limit the damage of a leaked token.
        </li>
      </ul>
    </GuideShell>
  );
}
