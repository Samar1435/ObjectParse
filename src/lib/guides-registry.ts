export interface GuideDefinition {
  slug: string;
  navTitle: string;
  title: string;
  description: string;
  relatedToolSlug: string;
}

export const guidesRegistry: GuideDefinition[] = [
  {
    slug: "json-formatter-guide",
    navTitle: "JSON Formatter Guide",
    title: "JSON Formatter Guide: Syntax Rules, Common Errors & Fixes",
    description:
      "Learn JSON syntax rules, the most common validation errors developers hit, and how to fix broken JSON fast.",
    relatedToolSlug: "json",
  },
  {
    slug: "jwt-guide",
    navTitle: "Understanding JWTs",
    title: "Understanding JWTs: Structure, Signing Algorithms & Security",
    description:
      "How a JSON Web Token is built, the difference between HMAC, RSA, and ECDSA signing, and common JWT security mistakes.",
    relatedToolSlug: "jwt",
  },
  {
    slug: "base64-guide",
    navTitle: "Base64 Encoding Explained",
    title: "Base64 Encoding Explained: How It Works & When to Use It",
    description:
      "What Base64 actually does, why it isn't encryption, and where it shows up in data URIs, emails, and APIs.",
    relatedToolSlug: "base64",
  },
];
