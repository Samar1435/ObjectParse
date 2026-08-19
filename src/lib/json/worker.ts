import type { JsonStats, JsonValue, ParseOptions, ParseResult, RepairResult, SearchQuery, SearchResult } from "./types";

/**
 * Reserved for a future Web Worker offload once a document crosses WORKER_THRESHOLD_NODES
 * (see constants.ts). Not wired up yet — main-thread debounced parsing covers v1's needs.
 */
export type JsonWorkerRequest =
  | { id: string; type: "parse"; text: string; options?: ParseOptions }
  | { id: string; type: "repair"; text: string }
  | { id: string; type: "stats"; value: JsonValue; rawText?: string }
  | { id: string; type: "search"; value: JsonValue; query: SearchQuery };

export type JsonWorkerResponse =
  | { id: string; type: "parse"; result: ParseResult }
  | { id: string; type: "repair"; result: RepairResult }
  | { id: string; type: "stats"; result: JsonStats }
  | { id: string; type: "search"; result: SearchResult };
