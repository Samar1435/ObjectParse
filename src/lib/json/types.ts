export type JsonPrimitive = string | number | boolean | null;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export type JsonNodeType = "string" | "number" | "boolean" | "null" | "object" | "array";

export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export type DiagnosticSeverity = "error" | "warning";

export type DiagnosticCode =
  | "InvalidSymbol"
  | "InvalidNumberFormat"
  | "PropertyNameExpected"
  | "ValueExpected"
  | "ColonExpected"
  | "CommaExpected"
  | "CloseBraceExpected"
  | "CloseBracketExpected"
  | "EndOfFileExpected"
  | "UnexpectedEndOfString"
  | "UnexpectedEndOfNumber"
  | "TrailingComma"
  | "DuplicateKey"
  | "Unknown";

export interface JsonDiagnostic {
  code: DiagnosticCode;
  message: string;
  severity: DiagnosticSeverity;
  range: Range;
  offset: number;
  length: number;
}

export interface ParseOptions {
  disallowComments?: boolean;
}

export interface ParseResult {
  value: JsonValue | undefined;
  valid: boolean;
  diagnostics: JsonDiagnostic[];
  text: string;
}

export interface FormatOptions {
  indent?: number | string;
  sortKeys?: boolean;
  asciiOnly?: boolean;
}

export interface RepairChange {
  description: string;
  before: string;
  after: string;
}

export interface RepairResult {
  success: boolean;
  repairedText?: string;
  value?: JsonValue;
  changes: RepairChange[];
  error?: string;
}

export interface ArrayStats {
  count: number;
  totalElements: number;
  lengths: number[];
  minLength: number;
  maxLength: number;
  avgLength: number;
  emptyArrayCount: number;
}

export interface DuplicateKeyInfo {
  path: string;
  pointer: string;
  key: string;
  occurrences: number;
}

export interface NumberPrecisionWarning {
  path: string;
  pointer: string;
  raw: string;
  parsedAsNumber: number;
}

export interface JsonStats {
  typeCounts: Record<JsonNodeType, number>;
  totalNodes: number;
  totalKeys: number;
  maxDepth: number;
  arrayStats: ArrayStats;
  duplicateKeys: DuplicateKeyInfo[];
  sizeBytes: number;
  sizeChars: number;
  rootType: JsonNodeType | "empty";
  numberPrecisionWarnings: NumberPrecisionWarning[];
  hasIntegerLikeKeys: boolean;
}

export type SearchMode = "key" | "value" | "both";
export type SearchValueType = "string" | "number" | "boolean" | "null";

export interface SearchQuery {
  term: string;
  mode?: SearchMode;
  matchCase?: boolean;
  useRegex?: boolean;
  wholeWord?: boolean;
  valueTypes?: SearchValueType[];
  limit?: number;
}

export interface SearchMatch {
  path: string;
  pointer: string;
  matchedIn: "key" | "value";
  key?: string;
  value: JsonValue;
  preview: string;
}

export interface SearchResult {
  matches: SearchMatch[];
  truncated: boolean;
  scanned: number;
  elapsedMs: number;
}

export type JsonPatchOp = "add" | "remove" | "replace";

export interface JsonPatchOperation {
  op: JsonPatchOp;
  path: string;
  value?: JsonValue;
}
