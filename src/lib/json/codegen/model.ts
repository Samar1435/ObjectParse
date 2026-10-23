import type { JsonObject, JsonValue } from "../types";
import { singularize, toPascalCase } from "./naming";

export type PrimitiveKind = "string" | "integer" | "float" | "boolean" | "null" | "any";

export interface PrimitiveTypeModel {
  kind: "primitive";
  primitive: PrimitiveKind;
}

export interface ArrayTypeModel {
  kind: "array";
  items: TypeModel;
  /** Some sampled elements were null; the item type itself excludes null. */
  itemNullable: boolean;
}

export interface ObjectTypeModel {
  kind: "object";
  name: string;
  fields: FieldModel[];
}

export interface UnknownTypeModel {
  kind: "unknown";
}

export type TypeModel = PrimitiveTypeModel | ArrayTypeModel | ObjectTypeModel | UnknownTypeModel;

export interface FieldModel {
  key: string;
  type: TypeModel;
  /** The value was `null` in at least one sampled occurrence of this key. */
  nullable: boolean;
  /** The key was missing entirely in at least one sampled sibling object (only possible when merging an array of objects). */
  optional: boolean;
}

export interface NamedObjectType {
  name: string;
  fields: FieldModel[];
}

export interface CodegenModel {
  root: TypeModel;
  /** Distinct named object types, parent-first, de-duplicated by structural shape. */
  objectTypes: NamedObjectType[];
}

interface BuildContext {
  usedNames: Set<string>;
  typeNameBySignature: Map<string, string>;
  fieldsByName: Map<string, FieldModel[]>;
  registrationOrder: string[];
}

function createContext(): BuildContext {
  return {
    usedNames: new Set(),
    typeNameBySignature: new Map(),
    fieldsByName: new Map(),
    registrationOrder: [],
  };
}

function typeSignature(type: TypeModel): string {
  switch (type.kind) {
    case "primitive":
      return `p:${type.primitive}`;
    case "array":
      return `a:${typeSignature(type.items)}:${type.itemNullable ? 1 : 0}`;
    case "object":
      return `o:${type.name}`;
    case "unknown":
      return "u";
  }
}

function fieldsSignature(fields: FieldModel[]): string {
  return fields
    .map((field) => `${field.key}:${typeSignature(field.type)}:${field.nullable ? 1 : 0}:${field.optional ? 1 : 0}`)
    .sort()
    .join("|");
}

/** Reuses a previously registered type when the field shape is identical, so e.g. two `address` objects with the same fields become one shared class. */
function registerObjectType(ctx: BuildContext, suggestedName: string, fields: FieldModel[]): string {
  const signature = fieldsSignature(fields);
  const existing = ctx.typeNameBySignature.get(signature);
  if (existing) return existing;

  const base = toPascalCase(suggestedName) || "Object";
  let name = base;
  let attempt = 2;
  while (ctx.usedNames.has(name)) {
    name = `${base}${attempt}`;
    attempt += 1;
  }

  ctx.usedNames.add(name);
  ctx.typeNameBySignature.set(signature, name);
  ctx.fieldsByName.set(name, fields);
  ctx.registrationOrder.push(name);
  return name;
}

function inferPrimitive(value: string | number | boolean | null): PrimitiveTypeModel {
  if (value === null) return { kind: "primitive", primitive: "null" };
  if (typeof value === "boolean") return { kind: "primitive", primitive: "boolean" };
  if (typeof value === "number") {
    return { kind: "primitive", primitive: Number.isInteger(value) ? "integer" : "float" };
  }
  return { kind: "primitive", primitive: "string" };
}

/** Combines type samples seen for the same slot (e.g. across array elements or merged object keys). Falls back to a permissive "any" when the schema is genuinely inconsistent. */
function mergeTypes(types: TypeModel[]): TypeModel {
  const known = types.filter((type) => type.kind !== "unknown");
  if (known.length === 0) return { kind: "unknown" };

  const kinds = new Set(known.map((type) => type.kind));
  if (kinds.size === 1 && known[0].kind === "primitive") {
    const primitives = new Set(known.map((type) => (type as PrimitiveTypeModel).primitive));
    if (primitives.size === 1) return known[0];
    if ([...primitives].every((primitive) => primitive === "integer" || primitive === "float")) {
      return { kind: "primitive", primitive: "float" };
    }
    return { kind: "primitive", primitive: "any" };
  }

  if (kinds.size === 1 && known[0].kind === "array") {
    const arrays = known as ArrayTypeModel[];
    return {
      kind: "array",
      items: mergeTypes(arrays.map((array) => array.items)),
      itemNullable: arrays.some((array) => array.itemNullable),
    };
  }

  return { kind: "primitive", primitive: "any" };
}

function inferValueType(value: JsonValue, suggestedName: string, ctx: BuildContext): TypeModel {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return inferPrimitive(value);
  }
  if (Array.isArray(value)) {
    const { itemType, itemNullable } = inferArrayItemType(value, singularize(suggestedName), ctx);
    return { kind: "array", items: itemType, itemNullable };
  }
  const fields = buildFields([value], suggestedName, ctx);
  const name = registerObjectType(ctx, suggestedName, fields);
  return { kind: "object", name, fields };
}

function inferArrayItemType(
  items: JsonValue[],
  suggestedName: string,
  ctx: BuildContext
): { itemType: TypeModel; itemNullable: boolean } {
  if (items.length === 0) return { itemType: { kind: "unknown" }, itemNullable: false };

  const nonNull = items.filter((item) => item !== null);
  const itemNullable = nonNull.length < items.length;
  if (nonNull.length === 0) return { itemType: { kind: "primitive", primitive: "null" }, itemNullable: true };

  const allObjects = nonNull.every((item) => typeof item === "object" && !Array.isArray(item));
  if (allObjects) {
    const fields = buildFields(nonNull as JsonObject[], suggestedName, ctx);
    const name = registerObjectType(ctx, suggestedName, fields);
    return { itemType: { kind: "object", name, fields }, itemNullable };
  }

  const allArrays = nonNull.every((item) => Array.isArray(item));
  if (allArrays) {
    const flattened = (nonNull as JsonValue[][]).flat();
    const nested = inferArrayItemType(flattened, suggestedName, ctx);
    return {
      itemType: { kind: "array", items: nested.itemType, itemNullable: nested.itemNullable },
      itemNullable,
    };
  }

  const types = nonNull.map((item) => inferValueType(item, suggestedName, ctx));
  return { itemType: mergeTypes(types), itemNullable };
}

/** Unions the keys of every sampled object (e.g. sibling elements of an array), marking a key `optional` when it isn't present in all samples. */
function buildFields(objects: JsonObject[], suggestedName: string, ctx: BuildContext): FieldModel[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const object of objects) {
    for (const key of Object.keys(object)) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }

  return keys.map((key) => {
    const samplesWithKey = objects.filter((object) => Object.prototype.hasOwnProperty.call(object, key));
    const optional = samplesWithKey.length < objects.length;
    const values = samplesWithKey.map((object) => object[key]);
    const nullable = values.some((value) => value === null);
    const nonNull = values.filter((value) => value !== null);

    let type: TypeModel;
    if (nonNull.length === 0) {
      type = { kind: "primitive", primitive: "null" };
    } else if (nonNull.every((value) => typeof value === "object" && !Array.isArray(value))) {
      const fields = buildFields(nonNull as JsonObject[], key, ctx);
      const name = registerObjectType(ctx, key, fields);
      type = { kind: "object", name, fields };
    } else if (nonNull.every((value) => Array.isArray(value))) {
      const flattened = (nonNull as JsonValue[][]).flat();
      const { itemType, itemNullable } = inferArrayItemType(flattened, singularize(key), ctx);
      type = { kind: "array", items: itemType, itemNullable };
    } else {
      type = mergeTypes(nonNull.map((value) => inferValueType(value, key, ctx)));
    }

    return { key, type, nullable, optional };
  });
}

export function buildCodegenModel(value: JsonValue, rootName: string): CodegenModel {
  const ctx = createContext();
  let root: TypeModel;

  if (Array.isArray(value)) {
    const { itemType, itemNullable } = inferArrayItemType(value, rootName, ctx);
    root = { kind: "array", items: itemType, itemNullable };
  } else if (value !== null && typeof value === "object") {
    const fields = buildFields([value], rootName, ctx);
    const name = registerObjectType(ctx, rootName, fields);
    root = { kind: "object", name, fields };
  } else {
    root = inferPrimitive(value);
  }

  const objectTypes = [...ctx.registrationOrder].reverse().map((name) => ({
    name,
    fields: ctx.fieldsByName.get(name) as FieldModel[],
  }));
  return { root, objectTypes };
}
