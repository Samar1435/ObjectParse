export interface BinaryFormat {
  mime: string;
  extension: string;
  label: string;
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  if (bytes.length < offset + length) return "";
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

interface Signature extends BinaryFormat {
  match: (bytes: Uint8Array) => boolean;
}

const SIGNATURES: Signature[] = [
  {
    mime: "image/png",
    extension: "png",
    label: "PNG image",
    match: (bytes) =>
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  {
    mime: "image/jpeg",
    extension: "jpg",
    label: "JPEG image",
    match: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    mime: "image/gif",
    extension: "gif",
    label: "GIF image",
    match: (bytes) => bytes.length >= 6 && asciiAt(bytes, 0, 4) === "GIF8",
  },
  {
    mime: "image/webp",
    extension: "webp",
    label: "WebP image",
    match: (bytes) => bytes.length >= 12 && asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WEBP",
  },
  {
    mime: "image/bmp",
    extension: "bmp",
    label: "BMP image",
    match: (bytes) => bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d,
  },
  {
    mime: "image/x-icon",
    extension: "ico",
    label: "ICO icon",
    match: (bytes) => bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00,
  },
  {
    mime: "application/pdf",
    extension: "pdf",
    label: "PDF document",
    match: (bytes) => asciiAt(bytes, 0, 5) === "%PDF-",
  },
  {
    mime: "application/zip",
    extension: "zip",
    label: "ZIP archive",
    match: (bytes) =>
      bytes.length >= 4 &&
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07),
  },
  {
    mime: "application/gzip",
    extension: "gz",
    label: "GZIP archive",
    match: (bytes) => bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b,
  },
  {
    mime: "video/mp4",
    extension: "mp4",
    label: "MP4 video",
    match: (bytes) => asciiAt(bytes, 4, 4) === "ftyp",
  },
  {
    mime: "audio/wav",
    extension: "wav",
    label: "WAV audio",
    match: (bytes) => asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WAVE",
  },
  {
    mime: "audio/mpeg",
    extension: "mp3",
    label: "MP3 audio",
    match: (bytes) =>
      asciiAt(bytes, 0, 3) === "ID3" || (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0),
  },
];

/** Sniffs a known binary format from its magic-byte signature — the only reliable way to tell
 * what decoded Base64 bytes actually are, since nothing else survives the round trip. */
export function detectBinaryFormat(bytes: Uint8Array): BinaryFormat | null {
  for (const signature of SIGNATURES) {
    if (signature.match(bytes)) return { mime: signature.mime, extension: signature.extension, label: signature.label };
  }
  return null;
}

export function isImageFormat(format: BinaryFormat | null): boolean {
  return format !== null && format.mime.startsWith("image/");
}

export function looksLikeSvgText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith("<svg") || (trimmed.startsWith("<?xml") && trimmed.includes("<svg"));
}
