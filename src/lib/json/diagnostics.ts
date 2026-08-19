import { parseTree, type ParseError, type ParseErrorCode } from "jsonc-parser";
import type { DiagnosticCode, JsonDiagnostic } from "./types";
import { offsetToRange } from "./position";

/**
 * jsonc-parser declares `ParseErrorCode` as a `const enum`, which Next.js's `isolatedModules`
 * TS setting forbids importing as a value (it can't guarantee cross-file inlining). We mirror
 * the documented numeric codes here instead and only ever import the type.
 */
const CODE = {
  InvalidSymbol: 1,
  InvalidNumberFormat: 2,
  PropertyNameExpected: 3,
  ValueExpected: 4,
  ColonExpected: 5,
  CommaExpected: 6,
  CloseBraceExpected: 7,
  CloseBracketExpected: 8,
  EndOfFileExpected: 9,
  InvalidCommentToken: 10,
  UnexpectedEndOfComment: 11,
  UnexpectedEndOfString: 12,
  UnexpectedEndOfNumber: 13,
  InvalidUnicode: 14,
  InvalidEscapeCharacter: 15,
  InvalidCharacter: 16,
} as const satisfies Record<string, ParseErrorCode>;

const MESSAGES: Partial<Record<ParseErrorCode, string>> = {
  [CODE.CommaExpected]: "A comma is missing before this value.",
  [CODE.CloseBraceExpected]: 'This object is never closed — add a matching "}".',
  [CODE.CloseBracketExpected]: 'This array is never closed — add a matching "]".',
  [CODE.ColonExpected]: 'A colon ":" is missing between this key and its value.',
  [CODE.PropertyNameExpected]: "Expected a property name here — object keys must be double-quoted strings.",
  [CODE.ValueExpected]: "Expected a value here — a string, number, object, array, true, false, or null.",
  [CODE.UnexpectedEndOfString]: "This string is never closed with a matching quote.",
  [CODE.InvalidNumberFormat]: "This doesn't look like a valid number.",
  [CODE.UnexpectedEndOfNumber]: "This number is incomplete.",
  [CODE.EndOfFileExpected]: "Unexpected extra content after the JSON value ended.",
  [CODE.InvalidUnicode]: "This unicode escape sequence is invalid.",
  [CODE.InvalidEscapeCharacter]: "This escape character is invalid inside a string.",
  [CODE.UnexpectedEndOfComment]: "This comment is never closed.",
  [CODE.InvalidCommentToken]: "Comments aren't valid in strict JSON.",
};

function messageForInvalidSymbol(text: string, offset: number): string {
  const char = text[offset];
  if (char === "'") return "Single quotes aren't valid JSON — use double quotes.";
  if (char !== undefined && /[A-Za-z_]/.test(char)) {
    return "Unquoted text isn't valid JSON — wrap keys and string values in double quotes.";
  }
  return "This character isn't valid here.";
}

function codeToName(code: ParseErrorCode): DiagnosticCode {
  switch (code) {
    case CODE.InvalidSymbol:
      return "InvalidSymbol";
    case CODE.InvalidNumberFormat:
      return "InvalidNumberFormat";
    case CODE.PropertyNameExpected:
      return "PropertyNameExpected";
    case CODE.ValueExpected:
      return "ValueExpected";
    case CODE.ColonExpected:
      return "ColonExpected";
    case CODE.CommaExpected:
      return "CommaExpected";
    case CODE.CloseBraceExpected:
      return "CloseBraceExpected";
    case CODE.CloseBracketExpected:
      return "CloseBracketExpected";
    case CODE.EndOfFileExpected:
      return "EndOfFileExpected";
    case CODE.UnexpectedEndOfString:
      return "UnexpectedEndOfString";
    case CODE.UnexpectedEndOfNumber:
      return "UnexpectedEndOfNumber";
    default:
      return "Unknown";
  }
}

export function codeToDiagnostic(error: ParseError, text: string, lineStarts: number[]): JsonDiagnostic {
  const message =
    error.error === CODE.InvalidSymbol
      ? messageForInvalidSymbol(text, error.offset)
      : MESSAGES[error.error] ?? "This part of the JSON isn't valid.";

  return {
    code: codeToName(error.error),
    message,
    severity: "error",
    range: offsetToRange(lineStarts, error.offset, Math.max(error.length, 1)),
    offset: error.offset,
    length: error.length,
  };
}

/**
 * jsonc-parser reports a trailing comma as `CommaExpected` only when strict mode
 * (`allowTrailingComma: false`) is used. We parse twice and diff the error offsets so a
 * trailing comma can be surfaced as its own warning without rejecting the rest of the document.
 */
export function detectTrailingCommas(text: string, lineStarts: number[]): JsonDiagnostic[] {
  const lenientErrors: ParseError[] = [];
  parseTree(text, lenientErrors, { allowTrailingComma: true, allowEmptyContent: true });
  const strictErrors: ParseError[] = [];
  parseTree(text, strictErrors, { allowTrailingComma: false, allowEmptyContent: true });

  const lenientOffsets = new Set(lenientErrors.map((error) => error.offset));
  return strictErrors
    .filter((error) => error.error === CODE.CommaExpected && !lenientOffsets.has(error.offset))
    .map((error) => ({
      code: "TrailingComma" as const,
      message: 'Trailing comma isn\'t valid in strict JSON — remove it, or use "Fix it" to repair automatically.',
      severity: "warning" as const,
      range: offsetToRange(lineStarts, error.offset, Math.max(error.length, 1)),
      offset: error.offset,
      length: error.length,
    }));
}
