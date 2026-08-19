import type { JsonObject, JsonValue } from "./types";

export function parsePointer(pointer: string): string[] {
  if (pointer === "") return [];
  if (!pointer.startsWith("/")) throw new Error(`Invalid JSON pointer: "${pointer}"`);
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

export function pointerToSegments(pointer: string): (string | number)[] {
  return parsePointer(pointer).map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

export function buildPointer(segments: ReadonlyArray<string | number>): string {
  if (segments.length === 0) return "";
  return (
    "/" +
    segments.map((segment) => String(segment).replace(/~/g, "~0").replace(/\//g, "~1")).join("/")
  );
}

export function pointerToPath(pointer: string): string {
  const segments = parsePointer(pointer);
  let path = "$";
  for (const segment of segments) {
    if (/^\d+$/.test(segment)) {
      path += `[${segment}]`;
    } else if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment)) {
      path += `.${segment}`;
    } else {
      path += `[${JSON.stringify(segment)}]`;
    }
  }
  return path;
}

export function getAtPointer(value: JsonValue, pointer: string): JsonValue | undefined {
  const segments = parsePointer(pointer);
  let current: JsonValue | undefined = value;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      current = Number.isInteger(index) ? current[index] : undefined;
    } else {
      current = (current as JsonObject)[segment];
    }
  }
  return current;
}
