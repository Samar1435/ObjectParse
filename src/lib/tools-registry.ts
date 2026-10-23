import {
  Binary,
  Braces,
  FileArchive,
  FileImage,
  FileText,
  Hash,
  KeyRound,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type ToolStatus = "available" | "coming-soon" | "hidden";

export type ToolGroupKey = "base64";

export interface ToolDefinition {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: ToolStatus;
  /** When set, this tool is nested under the named group's nav dropdown instead of appearing as its own top-level nav link. */
  group?: ToolGroupKey;
}

export interface ToolGroupDefinition {
  key: ToolGroupKey;
  label: string;
}

export const toolGroups: ToolGroupDefinition[] = [{ key: "base64", label: "Base64" }];

export const toolsRegistry: ToolDefinition[] = [
  {
    slug: "base64",
    title: "Base64",
    description:
      "Encode and decode text or files, with automatic URL-safe detection and a one-click handoff for decoded JSON.",
    icon: Binary,
    status: "available",
    group: "base64",
  },
  {
    slug: "base64-to-image",
    title: "Base64 to Image",
    description: "Decode a Base64 string into a viewable, downloadable image, or encode an image to Base64.",
    icon: FileImage,
    status: "available",
    group: "base64",
  },
  {
    slug: "base64-to-pdf",
    title: "Base64 to PDF",
    description: "Decode a Base64 string into a previewable, downloadable PDF, or encode a PDF to Base64.",
    icon: FileText,
    status: "available",
    group: "base64",
  },
  {
    slug: "base64-to-hex",
    title: "Base64 to Hex",
    description: "Convert Base64 to a byte-level hex dump for inspection, or build Base64 from raw hex.",
    icon: Hash,
    status: "available",
    group: "base64",
  },
  {
    slug: "base64-to-file",
    title: "Base64 to File",
    description: "Decode Base64 into any file type with automatic format detection, or encode any file to Base64.",
    icon: FileArchive,
    status: "available",
    group: "base64",
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
