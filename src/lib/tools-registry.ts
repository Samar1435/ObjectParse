import { Binary, Braces, KeyRound, ShieldCheck, type LucideIcon } from "lucide-react";

export type ToolStatus = "available" | "coming-soon" | "hidden";

export interface ToolDefinition {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: ToolStatus;
}

export const toolsRegistry: ToolDefinition[] = [
  {
    slug: "base64",
    title: "Base64",
    description:
      "Encode and decode text or files, with automatic URL-safe detection and a one-click handoff for decoded JSON.",
    icon: Binary,
    status: "available",
  },
  {
    slug: "json",
    title: "JSON",
    description:
      "Format, validate, auto-repair, search, and inspect JSON — with precise line and column error locations.",
    icon: Braces,
    status: "available",
  },
  {
    slug: "jwt",
    title: "JWT",
    description: "Decode, encode, and verify JSON Web Tokens — HMAC, RSA, and ECDSA.",
    icon: KeyRound,
    status: "available",
  },
  {
    slug: "auth-inspector",
    title: "Auth Inspector",
    description: "Log into multiple apps in this tab, auto-capture each token when you land back here, and decode them.",
    icon: ShieldCheck,
    status: "hidden",
  },
];
