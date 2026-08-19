import { decodeBase64 } from "@/lib/base64";
import { decodeToken } from "@/lib/jwt";

export type StorageArea = "localStorage" | "sessionStorage" | "url";

export interface AuthInspectorConfig {
  url: string;
  tokenKey: string;
}

export const DEFAULT_AUTH_INSPECTOR_CONFIG: AuthInspectorConfig = {
  url: "",
  tokenKey: "",
};

export const COMMON_TOKEN_KEYS: readonly string[] = [
  "token",
  "access_token",
  "accessToken",
  "authToken",
  "auth_token",
  "jwt",
  "id_token",
  "idToken",
  "sessionToken",
  "session_token",
];

export interface StorageEntry {
  area: StorageArea;
  key: string;
  value: string;
}

type BrowserStorageArea = "localStorage" | "sessionStorage";

const STORAGE_AREAS: readonly BrowserStorageArea[] = ["localStorage", "sessionStorage"];

function scanArea(win: Window, area: BrowserStorageArea): StorageEntry[] {
  const storage = win[area];
  const entries: StorageEntry[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key === null) continue;
    const value = storage.getItem(key);
    if (value !== null) entries.push({ area, key, value });
  }
  return entries;
}

// Covers OAuth redirects that land the token in the URL (query string or hash) instead of, or in
// addition to, writing it to storage — the case this tool relies on when a login flow redirects
// back to this tool's own origin.
function scanUrlParams(win: Window): StorageEntry[] {
  const entries: StorageEntry[] = [];
  const seen = new Set<string>();
  for (const raw of [win.location.search.replace(/^\?/, ""), win.location.hash.replace(/^#/, "")]) {
    if (!raw) continue;
    for (const [key, value] of new URLSearchParams(raw)) {
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ area: "url", key, value });
    }
  }
  return entries;
}

export function scanAllStorage(win: Window): StorageEntry[] {
  const entries: StorageEntry[] = [];
  for (const area of STORAGE_AREAS) {
    entries.push(...scanArea(win, area));
  }
  entries.push(...scanUrlParams(win));
  return entries;
}

export function rankTokenCandidates(entries: StorageEntry[], preferredKey: string): StorageEntry[] {
  const trimmedPreferred = preferredKey.trim();
  if (trimmedPreferred) {
    const exact = entries.filter((entry) => entry.key === trimmedPreferred);
    if (exact.length > 0) return exact;
  }
  const common = entries.filter((entry) => COMMON_TOKEN_KEYS.includes(entry.key));
  if (common.length > 0) return common;
  return entries;
}

export type TokenSourceKind = StorageArea | "manual";

export interface ResolvedToken {
  source: TokenSourceKind;
  key: string;
  value: string;
}

export function resolveToken(entries: StorageEntry[], tokenKey: string): ResolvedToken | null {
  const trimmedKey = tokenKey.trim();
  if (trimmedKey) {
    const exact = entries.find((entry) => entry.key === trimmedKey);
    if (exact) return { source: exact.area, key: exact.key, value: exact.value };
  }
  const [best] = rankTokenCandidates(entries, tokenKey);
  return best ? { source: best.area, key: best.key, value: best.value } : null;
}

export type DecodeMethod = "none" | "base64" | "url" | "json" | "jwt";

export const DECODE_METHODS: ReadonlyArray<{ value: DecodeMethod; label: string }> = [
  { value: "none", label: "None (raw)" },
  { value: "base64", label: "Base64" },
  { value: "url", label: "URL-decode" },
  { value: "json", label: "JSON (pretty)" },
  { value: "jwt", label: "JWT" },
];

export interface DecodeOutcome {
  ok: boolean;
  output: string;
  error?: string;
}

export function decodeValue(value: string, method: DecodeMethod): DecodeOutcome {
  try {
    switch (method) {
      case "none":
        return { ok: true, output: value };
      case "base64": {
        const decoded = decodeBase64(value);
        return decoded.kind === "text"
          ? { ok: true, output: decoded.text }
          : { ok: false, output: "", error: "Decoded bytes aren't valid UTF-8 text." };
      }
      case "url":
        return { ok: true, output: decodeURIComponent(value) };
      case "json":
        return { ok: true, output: JSON.stringify(JSON.parse(value), null, 2) };
      case "jwt":
        return { ok: true, output: JSON.stringify(decodeToken(value), null, 2) };
    }
  } catch (error) {
    return { ok: false, output: "", error: error instanceof Error ? error.message : "Couldn't decode this value." };
  }
}

export interface AuthInspectorField {
  id: string;
  area: StorageArea;
  key: string;
  decodeMethod: DecodeMethod;
}

export function isJwtShaped(value: string): boolean {
  return value.trim().split(".").length === 3;
}

export interface AuthInspectorSite {
  id: string;
  name: string;
  config: AuthInspectorConfig;
  fields: AuthInspectorField[];
  // Snapshot taken the moment this tab lands back on this tool's own URL after a login redirect —
  // there's no live connection to the site being logged into, so these persist rather than update
  // continuously.
  capturedToken: ResolvedToken | null;
  lastScanEntries: StorageEntry[];
  lastCheckedAt: number | null;
}

export function createDefaultSite(name: string): AuthInspectorSite {
  return {
    id: crypto.randomUUID(),
    name,
    config: { ...DEFAULT_AUTH_INSPECTOR_CONFIG },
    fields: [],
    capturedToken: null,
    lastScanEntries: [],
    lastCheckedAt: null,
  };
}

const BASE64ISH_PATTERN = /^[A-Za-z0-9+/_-]+={0,2}$/;

export function guessDecodeMethod(value: string): DecodeMethod {
  const trimmed = value.trim();
  if (isJwtShaped(trimmed)) return "jwt";
  if (trimmed.length > 0 && trimmed.length % 4 !== 1 && BASE64ISH_PATTERN.test(trimmed)) {
    const decoded = decodeValue(trimmed, "base64");
    if (decoded.ok) return "base64";
  }
  return "none";
}
