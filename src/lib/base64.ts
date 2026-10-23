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

export function bytesToPlainHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function bytesToHexDump(bytes: Uint8Array, bytesPerLine: number): string {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += bytesPerLine) {
    const chunk = bytes.subarray(offset, offset + bytesPerLine);
    const hex = Array.from(chunk)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ")
      .padEnd(bytesPerLine * 3 - 1, " ");
    const ascii = Array.from(chunk)
      .map((byte) => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : "."))
      .join("");
    lines.push(`${offset.toString(16).padStart(8, "0")}  ${hex}  ${ascii}`);
  }
  return lines.join("\n");
}

export function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/[\s:,-]/g, "");
  if (cleaned.length === 0) throw new Error("Invalid hex input: empty");
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) throw new Error("Invalid hex input: unexpected characters");
  if (cleaned.length % 2 !== 0) throw new Error("Invalid hex input: odd number of digits");
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
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
