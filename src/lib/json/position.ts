import type { Position, Range } from "./types";

export function buildLineStartIndex(text: string): number[] {
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) {
      lineStarts.push(i + 1);
    }
  }
  return lineStarts;
}

export function offsetToPosition(lineStarts: number[], offset: number): Position {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (lineStarts[mid] <= offset) low = mid;
    else high = mid - 1;
  }
  return { line: low + 1, column: offset - lineStarts[low] + 1 };
}

export function positionToOffset(lineStarts: number[], position: Position): number {
  const lineStart = lineStarts[Math.min(position.line - 1, lineStarts.length - 1)] ?? 0;
  return lineStart + (position.column - 1);
}

export function offsetToRange(lineStarts: number[], offset: number, length: number): Range {
  return {
    start: offsetToPosition(lineStarts, offset),
    end: offsetToPosition(lineStarts, offset + length),
  };
}
