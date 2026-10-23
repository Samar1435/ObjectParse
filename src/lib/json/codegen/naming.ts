const IRREGULAR_PLURALS: Record<string, string> = {
  children: "child",
  people: "person",
  men: "man",
  women: "woman",
  mice: "mouse",
  teeth: "tooth",
  feet: "foot",
  data: "datum",
  indices: "index",
};

/** Splits on non-alphanumeric separators and camelCase/PascalCase humps (`fooBar` -> `foo Bar`, `HTTPServer` -> `HTTP Server`). */
function splitWords(input: string): string[] {
  const withBoundaries = input
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return withBoundaries.split(" ").filter(Boolean);
}

function capitalize(word: string): string {
  return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1).toLowerCase();
}

export function toPascalCase(input: string): string {
  return splitWords(input).map(capitalize).join("");
}

export function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal.length === 0 ? pascal : pascal[0].toLowerCase() + pascal.slice(1);
}

export function toSnakeCase(input: string): string {
  return splitWords(input)
    .map((word) => word.toLowerCase())
    .join("_");
}

/** Best-effort English singularization; used only to name a type after a plural field/array. */
export function singularize(word: string): string {
  const lower = word.toLowerCase();
  const irregular = IRREGULAR_PLURALS[lower];
  if (irregular) return irregular;
  if (/ies$/i.test(word) && word.length > 3) return word.slice(0, -3) + "y";
  if (/(ses|xes|zes|ches|shes)$/i.test(word)) return word.slice(0, -2);
  if (/s$/i.test(word) && !/ss$/i.test(word) && word.length > 1) return word.slice(0, -1);
  return word;
}

export function sanitizeRootName(input: string, fallback: string): string {
  const pascal = toPascalCase(input);
  if (!pascal) return fallback;
  return /^[0-9]/.test(pascal) ? `_${pascal}` : pascal;
}

export function toSqlIdentifier(input: string): string {
  const snake = toSnakeCase(input) || "value";
  return /^[0-9]/.test(snake) ? `_${snake}` : snake;
}
