import { buildOgImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from "@/lib/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return buildOgImage("Base64 to Hex Converter", "Decode Base64 into a byte-level hex dump, or encode hex to Base64");
}
