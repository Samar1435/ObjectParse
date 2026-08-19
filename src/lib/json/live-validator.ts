import type { ParseResult } from "./types";
import { parseJson } from "./parse";
import { DEFAULT_DEBOUNCE_MS, LARGE_DOC_BYTES, LARGE_DOC_DEBOUNCE_MS } from "./constants";

export interface LiveValidatorOptions {
  debounceMs?: number;
  largeDocBytes?: number;
  largeDocDebounceMs?: number;
}

export interface LiveValidator {
  onChange(text: string): void;
  subscribe(callback: (result: ParseResult) => void): () => void;
  dispose(): void;
}

export function createLiveValidator(options?: LiveValidatorOptions): LiveValidator {
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const largeDocBytes = options?.largeDocBytes ?? LARGE_DOC_BYTES;
  const largeDocDebounceMs = options?.largeDocDebounceMs ?? LARGE_DOC_DEBOUNCE_MS;

  const listeners = new Set<(result: ParseResult) => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    onChange(text: string) {
      if (timer !== undefined) clearTimeout(timer);
      const delay = text.length > largeDocBytes ? largeDocDebounceMs : debounceMs;
      timer = setTimeout(() => {
        const result = parseJson(text);
        for (const listener of listeners) listener(result);
      }, delay);
    },
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    dispose() {
      if (timer !== undefined) clearTimeout(timer);
      listeners.clear();
    },
  };
}
