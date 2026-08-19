import { applyPatches, enablePatches, produceWithPatches, type Patch } from "immer";
import type { JsonPatchOperation, JsonValue } from "./types";
import { parsePointer, pointerToSegments } from "./pointer";

enablePatches();

export type JsonContainer = Extract<JsonValue, object>;

export interface EditResult {
  value: JsonContainer;
  patches: JsonPatchOperation[];
  inversePatches: JsonPatchOperation[];
}

function toJsonPatchOperations(patches: readonly Patch[]): JsonPatchOperation[] {
  return patches.map((patch) => ({
    op: patch.op,
    path: "/" + patch.path.map((segment) => String(segment).replace(/~/g, "~0").replace(/\//g, "~1")).join("/"),
    value: patch.value as JsonValue | undefined,
  }));
}

function runEdit(value: JsonContainer, mutate: (draft: JsonContainer) => void): EditResult {
  const [nextValue, patches, inversePatches] = produceWithPatches(value, mutate);
  return {
    value: nextValue as JsonContainer,
    patches: toJsonPatchOperations(patches),
    inversePatches: toJsonPatchOperations(inversePatches),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function navigateTo(draft: any, segments: string[]): any {
  let current = draft;
  for (const segment of segments) {
    current = Array.isArray(current) ? current[Number(segment)] : current[segment];
  }
  return current;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveParent(draft: any, segments: string[]): { parent: any; key: string | number } {
  if (segments.length === 0) {
    throw new Error("Pointer must reference a property or array element, not the document root");
  }
  const parent = navigateTo(draft, segments.slice(0, -1));
  const lastSegment = segments[segments.length - 1];
  return { parent, key: Array.isArray(parent) ? Number(lastSegment) : lastSegment };
}

export function setValueAtPointer(value: JsonContainer, pointer: string, newValue: JsonValue): EditResult {
  const segments = parsePointer(pointer);
  return runEdit(value, (draft) => {
    const { parent, key } = resolveParent(draft, segments);
    parent[key] = newValue;
  });
}

export function deleteAtPointer(value: JsonContainer, pointer: string): EditResult {
  const segments = parsePointer(pointer);
  return runEdit(value, (draft) => {
    const { parent, key } = resolveParent(draft, segments);
    if (Array.isArray(parent)) {
      parent.splice(key as number, 1);
    } else {
      delete parent[key];
    }
  });
}

export function insertAtPointer(
  value: JsonContainer,
  parentPointer: string,
  keyOrIndex: string | number,
  newValue: JsonValue
): EditResult {
  const segments = parsePointer(parentPointer);
  return runEdit(value, (draft) => {
    const target = segments.length === 0 ? draft : navigateTo(draft, segments);
    if (Array.isArray(target)) {
      const index = typeof keyOrIndex === "number" ? keyOrIndex : target.length;
      target.splice(index, 0, newValue);
    } else {
      target[String(keyOrIndex)] = newValue;
    }
  });
}

export function renameKey(value: JsonContainer, objectPointer: string, oldKey: string, newKey: string): EditResult {
  const segments = parsePointer(objectPointer);
  return runEdit(value, (draft) => {
    const target = segments.length === 0 ? draft : navigateTo(draft, segments);
    if (Array.isArray(target) || !(oldKey in target)) {
      throw new Error(`Cannot rename "${oldKey}": target is not an object with that key`);
    }
    if (newKey !== oldKey && newKey in target) {
      throw new Error(`Cannot rename "${oldKey}" to "${newKey}": key already exists`);
    }
    const entries = Object.entries(target);
    for (const key of Object.keys(target)) delete target[key];
    for (const [key, entryValue] of entries) {
      target[key === oldKey ? newKey : key] = entryValue;
    }
  });
}

export function moveArrayItem(
  value: JsonContainer,
  arrayPointer: string,
  fromIndex: number,
  toIndex: number
): EditResult {
  const segments = parsePointer(arrayPointer);
  return runEdit(value, (draft) => {
    const target = segments.length === 0 ? draft : navigateTo(draft, segments);
    if (!Array.isArray(target)) throw new Error(`Pointer "${arrayPointer}" does not reference an array`);
    const [item] = target.splice(fromIndex, 1);
    target.splice(toIndex, 0, item);
  });
}

export function reorderKeys(value: JsonContainer, objectPointer: string, newKeyOrder: string[]): EditResult {
  const segments = parsePointer(objectPointer);
  return runEdit(value, (draft) => {
    const target = segments.length === 0 ? draft : navigateTo(draft, segments);
    if (Array.isArray(target)) throw new Error(`Pointer "${objectPointer}" does not reference an object`);
    const entries = new Map(Object.entries(target));
    for (const key of Object.keys(target)) delete target[key];
    for (const key of newKeyOrder) {
      if (entries.has(key)) target[key] = entries.get(key);
    }
  });
}

export function applyJsonPatches(value: JsonContainer, patches: JsonPatchOperation[]): JsonContainer {
  const immerPatches: Patch[] = patches.map((patch) => ({
    op: patch.op,
    path: pointerToSegments(patch.path),
    value: patch.value,
  }));
  return applyPatches(value, immerPatches) as JsonContainer;
}

interface HistoryEntry {
  patches: JsonPatchOperation[];
  inversePatches: JsonPatchOperation[];
}

export class EditHistory {
  private currentValue: JsonContainer;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  constructor(initial: JsonContainer) {
    this.currentValue = initial;
  }

  get current(): JsonContainer {
    return this.currentValue;
  }

  apply(edit: EditResult): void {
    this.undoStack.push({ patches: edit.patches, inversePatches: edit.inversePatches });
    this.redoStack = [];
    this.currentValue = edit.value;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): JsonContainer | undefined {
    const entry = this.undoStack.pop();
    if (!entry) return undefined;
    this.currentValue = applyJsonPatches(this.currentValue, entry.inversePatches);
    this.redoStack.push(entry);
    return this.currentValue;
  }

  redo(): JsonContainer | undefined {
    const entry = this.redoStack.pop();
    if (!entry) return undefined;
    this.currentValue = applyJsonPatches(this.currentValue, entry.patches);
    this.undoStack.push(entry);
    return this.currentValue;
  }
}
