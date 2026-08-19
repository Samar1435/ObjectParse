import { visit } from "jsonc-parser";
import type {
  ArrayStats,
  DuplicateKeyInfo,
  JsonNodeType,
  JsonObject,
  JsonStats,
  JsonValue,
  NumberPrecisionWarning,
} from "./types";
import { buildPointer, pointerToPath } from "./pointer";
import { MAX_SAFE_SIGNIFICANT_DIGITS } from "./constants";

const INTEGER_LIKE_KEY = /^(0|[1-9]\d*)$/;

function typeOfValue(value: JsonValue): JsonNodeType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as JsonNodeType;
}

interface WalkFrame {
  value: JsonValue;
  depth: number;
}

export function computeStats(value: JsonValue, rawText?: string): JsonStats {
  const typeCounts: Record<JsonNodeType, number> = {
    string: 0,
    number: 0,
    boolean: 0,
    null: 0,
    object: 0,
    array: 0,
  };
  let totalNodes = 0;
  let totalKeys = 0;
  let maxDepth = 0;
  let hasIntegerLikeKeys = false;
  const arrayLengths: number[] = [];
  let emptyArrayCount = 0;

  const stack: WalkFrame[] = [{ value, depth: 1 }];
  while (stack.length > 0) {
    const frame = stack.pop() as WalkFrame;
    const type = typeOfValue(frame.value);
    typeCounts[type]++;
    totalNodes++;
    maxDepth = Math.max(maxDepth, frame.depth);

    if (type === "array") {
      const arr = frame.value as JsonValue[];
      arrayLengths.push(arr.length);
      if (arr.length === 0) emptyArrayCount++;
      for (const item of arr) stack.push({ value: item, depth: frame.depth + 1 });
    } else if (type === "object") {
      const obj = frame.value as JsonObject;
      const keys = Object.keys(obj);
      totalKeys += keys.length;
      if (!hasIntegerLikeKeys && keys.some((key) => INTEGER_LIKE_KEY.test(key))) {
        hasIntegerLikeKeys = true;
      }
      for (const key of keys) stack.push({ value: obj[key], depth: frame.depth + 1 });
    }
  }

  const arrayStats: ArrayStats = {
    count: arrayLengths.length,
    totalElements: arrayLengths.reduce((sum, n) => sum + n, 0),
    lengths: arrayLengths,
    minLength: arrayLengths.length ? Math.min(...arrayLengths) : 0,
    maxLength: arrayLengths.length ? Math.max(...arrayLengths) : 0,
    avgLength: arrayLengths.length ? arrayLengths.reduce((sum, n) => sum + n, 0) / arrayLengths.length : 0,
    emptyArrayCount,
  };

  const text = rawText ?? JSON.stringify(value);
  const { duplicates, precisionWarnings } = scanRawText(text);

  return {
    typeCounts,
    totalNodes,
    totalKeys,
    maxDepth,
    arrayStats,
    duplicateKeys: duplicates,
    sizeBytes: new TextEncoder().encode(text).length,
    sizeChars: text.length,
    rootType: totalNodes === 0 ? "empty" : typeOfValue(value),
    numberPrecisionWarnings: precisionWarnings,
    hasIntegerLikeKeys,
  };
}

function countSignificantDigits(raw: string): number {
  const digitsOnly = raw
    .replace(/^[+-]/, "")
    .replace(/e[+-]?\d+$/i, "")
    .replace(/[^0-9]/g, "")
    .replace(/^0+(?=\d)/, "");
  return digitsOnly.length;
}

/**
 * A single SAX-style pass over the raw text via jsonc-parser's `visit`, since native
 * `JSON.parse` silently drops duplicate object keys and can't tell us where a number
 * literal had more significant digits than a JS double can represent exactly.
 */
export function scanRawText(text: string): {
  duplicates: DuplicateKeyInfo[];
  precisionWarnings: NumberPrecisionWarning[];
} {
  const duplicates: DuplicateKeyInfo[] = [];
  const precisionWarnings: NumberPrecisionWarning[] = [];
  const keyCountStack: Map<string, number>[] = [];

  visit(
    text,
    {
      onObjectBegin: () => {
        keyCountStack.push(new Map());
      },
      onObjectProperty: (property, _offset, _length, _startLine, _startCharacter, pathSupplier) => {
        const frame = keyCountStack[keyCountStack.length - 1];
        if (!frame) return;
        const count = (frame.get(property) ?? 0) + 1;
        frame.set(property, count);
        if (count > 1) {
          const pointer = buildPointer([...pathSupplier(), property]);
          duplicates.push({ path: pointerToPath(pointer), pointer, key: property, occurrences: count });
        }
      },
      onObjectEnd: () => {
        keyCountStack.pop();
      },
      onLiteralValue: (value, offset, length, _startLine, _startCharacter, pathSupplier) => {
        if (typeof value !== "number") return;
        const raw = text.slice(offset, offset + length);
        if (countSignificantDigits(raw) > MAX_SAFE_SIGNIFICANT_DIGITS) {
          const pointer = buildPointer(pathSupplier());
          precisionWarnings.push({ path: pointerToPath(pointer), pointer, raw, parsedAsNumber: value });
        }
      },
    },
    { allowTrailingComma: true, allowEmptyContent: true }
  );

  return { duplicates, precisionWarnings };
}

export function detectDuplicateKeys(text: string): DuplicateKeyInfo[] {
  return scanRawText(text).duplicates;
}
