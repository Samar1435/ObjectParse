import { jsonrepair, JSONRepairError } from "jsonrepair";
import { diffChars } from "diff";
import type { RepairChange, RepairResult } from "./types";
import { parseJson } from "./parse";

/** jsonrepair doesn't document handling JS-only constants, so we normalize them ourselves first. */
function normalizeJsConstants(text: string): string {
  return text.replace(/\bNaN\b|\bundefined\b|-?\bInfinity\b/g, "null");
}

function classifyChange(before: string, after: string): string {
  if (before === "'" && after === '"') return "Converted a single quote to a double quote";
  if (before === "," && after === "") return "Removed a trailing comma";
  if (before === "" && after === ",") return "Added a missing comma";
  if (before === "" && after === ":") return 'Added a missing colon';
  if (before === "" && (after === "}" || after === "]")) return `Added a missing closing "${after}"`;
  if (/^[A-Za-z_]\w*$/.test(before) && after.startsWith('"') && after.endsWith('"')) {
    return "Quoted an unquoted key or value";
  }
  if (before === "" && after === '"') return "Added a quote around an unquoted key or value";
  if (before === '"' && after === "") return "Removed a stray quote";
  if (before.length > 0 && after.length === 0) return `Removed "${before}"`;
  if (before.length === 0 && after.length > 0) return `Added "${after}"`;
  return `Changed "${before}" to "${after}"`;
}

function summarizeChanges(before: string, after: string): RepairChange[] {
  const changes = diffChars(before, after);
  const result: RepairChange[] = [];
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    if (!change.removed && !change.added) continue;
    const next = changes[i + 1];
    if (change.removed && next?.added) {
      result.push({ description: classifyChange(change.value, next.value), before: change.value, after: next.value });
      i++;
    } else if (change.removed) {
      result.push({ description: classifyChange(change.value, ""), before: change.value, after: "" });
    } else {
      result.push({ description: classifyChange("", change.value), before: "", after: change.value });
    }
  }
  return result;
}

export function repairJson(text: string): RepairResult {
  const normalized = normalizeJsConstants(text);
  try {
    const repairedText = jsonrepair(normalized);
    const parsed = parseJson(repairedText);
    if (!parsed.valid || parsed.value === undefined) {
      return { success: false, changes: [], error: "The repaired text is still not valid JSON." };
    }
    return {
      success: true,
      repairedText,
      value: parsed.value,
      changes: summarizeChanges(text, repairedText),
    };
  } catch (error) {
    const message = error instanceof JSONRepairError ? error.message : "Could not automatically repair this JSON.";
    return { success: false, changes: [], error: message };
  }
}
