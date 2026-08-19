import { parseTree, getNodeValue, type ParseError } from "jsonc-parser";
import type { JsonValue, ParseOptions, ParseResult } from "./types";
import { buildLineStartIndex } from "./position";
import { codeToDiagnostic, detectTrailingCommas } from "./diagnostics";

export function parseJson(text: string, options?: ParseOptions): ParseResult {
  try {
    const value = JSON.parse(text) as JsonValue;
    return { value, valid: true, diagnostics: [], text };
  } catch {
    // Not strict JSON — fall through to the tolerant parser for multi-error diagnostics.
  }

  const lineStarts = buildLineStartIndex(text);
  const errors: ParseError[] = [];
  const root = parseTree(text, errors, {
    allowTrailingComma: true,
    disallowComments: options?.disallowComments ?? false,
    allowEmptyContent: true,
  });
  const value = root ? (getNodeValue(root) as JsonValue) : undefined;

  const diagnostics = [
    ...errors.map((error) => codeToDiagnostic(error, text, lineStarts)),
    ...detectTrailingCommas(text, lineStarts),
  ];

  return { value, valid: false, diagnostics, text };
}
