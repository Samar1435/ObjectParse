import type { FormatOptions, JsonObject, JsonValue } from "./types";

function sortObjectKeysDeep(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(sortObjectKeysDeep);
  if (value !== null && typeof value === "object") {
    const sorted: JsonObject = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortObjectKeysDeep(value[key]);
    }
    return sorted;
  }
  return value;
}

function toUnicodeEscape(code: number): string {
  return "\\u" + code.toString(16).padStart(4, "0");
}

/**
 * JSON.stringify only escapes what's structurally required (quotes, backslashes, control
 * characters); it has no native "ensure ASCII" flag, so this walks code points by hand,
 * re-splitting anything above the astral plane back into a UTF-16 surrogate pair.
 */
function escapeNonAscii(text: string): string {
  let result = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      result += char;
    } else if (code > 0xffff) {
      const high = Math.floor((code - 0x10000) / 0x400) + 0xd800;
      const low = ((code - 0x10000) % 0x400) + 0xdc00;
      result += toUnicodeEscape(high) + toUnicodeEscape(low);
    } else {
      result += toUnicodeEscape(code);
    }
  }
  return result;
}

export function formatJson(value: JsonValue, options?: FormatOptions): string {
  const prepared = options?.sortKeys ? sortObjectKeysDeep(value) : value;
  const text = JSON.stringify(prepared, null, options?.indent ?? 2);
  return options?.asciiOnly ? escapeNonAscii(text) : text;
}

export function minifyJson(value: JsonValue, options?: Pick<FormatOptions, "sortKeys" | "asciiOnly">): string {
  const prepared = options?.sortKeys ? sortObjectKeysDeep(value) : value;
  const text = JSON.stringify(prepared);
  return options?.asciiOnly ? escapeNonAscii(text) : text;
}
