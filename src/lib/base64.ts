export type Base64Alphabet = "standard" | "url-safe";

export function detectAlphabet(input: string): Base64Alphabet {
  return /[-_]/.test(input.trim()) ? "url-safe" : "standard";
}

function toStandardBase64(input: string): string {
  let base64 = input.trim().replace(/-/g, "+").replace(/_/g, "/");
  const remainder = base64.length % 4;
  if (remainder === 2) base64 += "==";
  else if (remainder === 3) base64 += "=";
  else if (remainder === 1) throw new Error("Invalid base64 input: unexpected length");
  return base64;
}

export function encodeBytesToBase64(bytes: Uint8Array, options?: { urlSafe?: boolean }): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);
  if (options?.urlSafe) {
    base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return base64;
}

export function encodeTextToBase64(text: string, options?: { urlSafe?: boolean }): string {
  return encodeBytesToBase64(new TextEncoder().encode(text), options);
}

export function toUrlSafeBase64(standardBase64: string): string {
  return standardBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64ToBytes(input: string): Uint8Array {
  const binary = atob(toStandardBase64(input));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface DecodeTextResult {
  kind: "text";
  text: string;
}

export interface DecodeBinaryResult {
  kind: "binary";
  bytes: Uint8Array;
}

export type DecodeResult = DecodeTextResult | DecodeBinaryResult;

export function decodeBase64(input: string): DecodeResult {
  const bytes = decodeBase64ToBytes(input);
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { kind: "text", text };
  } catch {
    return { kind: "binary", bytes };
  }
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
      resolve({ base64, mimeType: file.type || "application/octet-stream" });
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  return new Blob([decodeBase64ToBytes(base64) as Uint8Array<ArrayBuffer>], { type: mimeType });
}

export type JsonHandoffState = "valid" | "likely" | "none";

export function getJsonHandoffState(decoded: string): JsonHandoffState {
  const trimmed = decoded.trim();
  if (!trimmed || !(trimmed.startsWith("{") || trimmed.startsWith("["))) return "none";
  try {
    JSON.parse(trimmed);
    return "valid";
  } catch {
    return "likely";
  }
}
