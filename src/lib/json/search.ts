import type { JsonValue, SearchMatch, SearchMode, SearchQuery, SearchResult, SearchValueType } from "./types";
import { buildPointer, pointerToPath } from "./pointer";
import { SEARCH_RESULT_LIMIT } from "./constants";

type ScalarType = SearchValueType | "object" | "array";

function typeOfValue(value: JsonValue): ScalarType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as ScalarType;
}

function toPreview(value: JsonValue): string {
  if (typeof value === "string") return value.length > 120 ? `${value.slice(0, 120)}…` : value;
  if (value === null || typeof value === "number" || typeof value === "boolean") return String(value);
  return Array.isArray(value) ? `[Array(${value.length})]` : "{Object}";
}

function buildMatcher(query: SearchQuery): (text: string) => boolean {
  const term = query.term;
  if (query.useRegex) {
    const regex = new RegExp(term, query.matchCase ? "u" : "iu");
    return (text) => regex.test(text);
  }
  if (query.wholeWord) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, query.matchCase ? "" : "i");
    return (text) => regex.test(text);
  }
  const needle = query.matchCase ? term : term.toLowerCase();
  return (text) => (query.matchCase ? text : text.toLowerCase()).includes(needle);
}

interface StackFrame {
  value: JsonValue;
  segments: (string | number)[];
  parentKey?: string;
}

export function* searchJsonIter(
  value: JsonValue,
  query: SearchQuery,
  counter: { scanned: number } = { scanned: 0 }
): Generator<SearchMatch> {
  const mode: SearchMode = query.mode ?? "both";
  const matches = buildMatcher(query);
  const stack: StackFrame[] = [{ value, segments: [] }];

  while (stack.length > 0) {
    const frame = stack.pop() as StackFrame;
    counter.scanned++;
    const type = typeOfValue(frame.value);

    if (frame.parentKey !== undefined && (mode === "key" || mode === "both") && matches(frame.parentKey)) {
      const pointer = buildPointer(frame.segments);
      yield {
        path: pointerToPath(pointer),
        pointer,
        matchedIn: "key",
        key: frame.parentKey,
        value: frame.value,
        preview: toPreview(frame.value),
      };
    }

    if ((mode === "value" || mode === "both") && type !== "object" && type !== "array") {
      const typeAllowed = !query.valueTypes || query.valueTypes.includes(type as SearchValueType);
      if (typeAllowed && matches(String(frame.value))) {
        const pointer = buildPointer(frame.segments);
        yield {
          path: pointerToPath(pointer),
          pointer,
          matchedIn: "value",
          key: frame.parentKey,
          value: frame.value,
          preview: toPreview(frame.value),
        };
      }
    }

    if (type === "array") {
      const arr = frame.value as JsonValue[];
      for (let i = arr.length - 1; i >= 0; i--) {
        stack.push({ value: arr[i], segments: [...frame.segments, i] });
      }
    } else if (type === "object") {
      const obj = frame.value as { [key: string]: JsonValue };
      const keys = Object.keys(obj);
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        stack.push({ value: obj[key], segments: [...frame.segments, key], parentKey: key });
      }
    }
  }
}

const MAX_SUGGESTION_LENGTH = 60;

/**
 * Collects unique object keys and short primitive values from the document, for the search
 * box's autocomplete dropdown. Iterative (explicit stack) for the same reason as the main
 * search/stats walks — avoids recursion-depth risk on pathologically deep documents.
 */
export function collectSearchSuggestions(value: JsonValue, limit = 500): string[] {
  const suggestions = new Set<string>();
  const stack: JsonValue[] = [value];

  while (stack.length > 0 && suggestions.size < limit) {
    const current = stack.pop() as JsonValue;
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
    } else if (current !== null && typeof current === "object") {
      for (const [key, val] of Object.entries(current)) {
        suggestions.add(key);
        stack.push(val);
      }
    } else if (typeof current === "string") {
      if (current.length > 0 && current.length <= MAX_SUGGESTION_LENGTH) suggestions.add(current);
    } else if (typeof current === "number" || typeof current === "boolean") {
      suggestions.add(String(current));
    }
  }

  return Array.from(suggestions);
}

export function searchJson(value: JsonValue, query: SearchQuery): SearchResult {
  const start = Date.now();
  const limit = query.limit ?? SEARCH_RESULT_LIMIT;
  const counter = { scanned: 0 };
  const matches: SearchMatch[] = [];
  let truncated = false;

  for (const match of searchJsonIter(value, query, counter)) {
    if (matches.length >= limit) {
      truncated = true;
      break;
    }
    matches.push(match);
  }

  return { matches, truncated, scanned: counter.scanned, elapsedMs: Date.now() - start };
}
