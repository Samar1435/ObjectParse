import type { JsonValue } from "../types";
import { buildCodegenModel } from "./model";
import type { ArrayTypeModel, CodegenModel, FieldModel, PrimitiveKind, TypeModel } from "./model";
import { sanitizeRootName, toCamelCase, toPascalCase, toSnakeCase, toSqlIdentifier } from "./naming";

export type CodegenLanguageId = "typescript" | "javascript" | "python" | "csharp" | "java" | "go" | "sql";

export interface CodegenLanguageOption {
  id: CodegenLanguageId;
  label: string;
  monacoLanguage: string;
}

export const CODEGEN_LANGUAGES: CodegenLanguageOption[] = [
  { id: "typescript", label: "TypeScript", monacoLanguage: "typescript" },
  { id: "javascript", label: "JavaScript", monacoLanguage: "javascript" },
  { id: "python", label: "Python", monacoLanguage: "python" },
  { id: "csharp", label: "C#", monacoLanguage: "csharp" },
  { id: "java", label: "Java", monacoLanguage: "java" },
  { id: "go", label: "Go", monacoLanguage: "go" },
  { id: "sql", label: "SQL (CREATE TABLE)", monacoLanguage: "sql" },
];

const PRIMITIVE_MAP: Record<Exclude<CodegenLanguageId, "javascript">, Record<PrimitiveKind, string>> & {
  javascript: Record<PrimitiveKind, string>;
} = {
  typescript: { string: "string", integer: "number", float: "number", boolean: "boolean", null: "null", any: "any" },
  javascript: { string: "string", integer: "number", float: "number", boolean: "boolean", null: "null", any: "*" },
  python: { string: "str", integer: "int", float: "float", boolean: "bool", null: "None", any: "Any" },
  csharp: { string: "string", integer: "int", float: "double", boolean: "bool", null: "object", any: "object" },
  java: { string: "String", integer: "int", float: "double", boolean: "boolean", null: "Object", any: "Object" },
  go: { string: "string", integer: "int", float: "float64", boolean: "bool", null: "any", any: "any" },
  sql: {
    string: "VARCHAR(255)",
    integer: "INT",
    float: "DOUBLE",
    boolean: "BOOLEAN",
    null: "TEXT",
    any: "TEXT",
  },
};

const JAVA_BOXED: Partial<Record<PrimitiveKind, string>> = {
  integer: "Integer",
  float: "Double",
  boolean: "Boolean",
};

function primitiveNoun(primitive: PrimitiveKind): string {
  switch (primitive) {
    case "string":
      return "strings";
    case "integer":
      return "integers";
    case "float":
      return "numbers";
    case "boolean":
      return "booleans";
    case "null":
      return "null values";
    case "any":
      return "mixed values";
  }
}

function describeRootShape(type: TypeModel): string {
  switch (type.kind) {
    case "primitive":
      return type.primitive === "null" ? "a null value" : `a ${type.primitive} value`;
    case "array":
      return type.items.kind === "primitive"
        ? `an array of ${primitiveNoun(type.items.primitive)}`
        : `an array of ${describeRootShape(type.items)}`;
    case "unknown":
      return "an empty array (element type unknown)";
    case "object":
      return `an object (see ${type.name})`;
  }
}

function nonObjectRootComment(commentPrefix: string, root: TypeModel): string {
  return `${commentPrefix} This JSON document is ${describeRootShape(root)} — no class definition is needed here.`;
}

function collectFieldTypeKinds(model: CodegenModel): Set<TypeModel["kind"] | "any-primitive"> {
  const kinds = new Set<TypeModel["kind"] | "any-primitive">();
  const visit = (type: TypeModel) => {
    kinds.add(type.kind);
    if (type.kind === "array") visit(type.items);
    if (type.kind === "primitive" && type.primitive === "any") kinds.add("any-primitive");
  };
  for (const objectType of model.objectTypes) {
    for (const field of objectType.fields) visit(field.type);
  }
  return kinds;
}

// ---------------------------------------------------------------------------
// TypeScript
// ---------------------------------------------------------------------------

function tsPropertyName(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function tsTypeText(type: TypeModel, nullable: boolean): string {
  const base = tsBaseType(type);
  return nullable ? `${base} | null` : base;
}

function tsBaseType(type: TypeModel): string {
  switch (type.kind) {
    case "primitive":
      return PRIMITIVE_MAP.typescript[type.primitive];
    case "array": {
      const itemText = tsTypeText(type.items, type.itemNullable);
      return itemText.includes(" | ") ? `(${itemText})[]` : `${itemText}[]`;
    }
    case "object":
      return type.name;
    case "unknown":
      return "unknown";
  }
}

function renderTypeScript(model: CodegenModel): string {
  if (model.objectTypes.length === 0) return nonObjectRootComment("//", model.root);

  return model.objectTypes
    .map((type) => {
      const lines = type.fields.map((field) => {
        const optionalMark = field.optional ? "?" : "";
        return `  ${tsPropertyName(field.key)}${optionalMark}: ${tsTypeText(field.type, field.nullable)};`;
      });
      return `export interface ${type.name} {\n${lines.length > 0 ? lines.join("\n") : "  // (no fields)"}\n}`;
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// JavaScript (JSDoc typedef + ES6 class)
// ---------------------------------------------------------------------------

function jsMemberExpr(objectExpr: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${objectExpr}.${key}` : `${objectExpr}[${JSON.stringify(key)}]`;
}

function jsDocType(type: TypeModel, nullable: boolean): string {
  const base = jsDocBaseType(type);
  return nullable ? `(${base}|null)` : base;
}

function jsDocBaseType(type: TypeModel): string {
  switch (type.kind) {
    case "primitive":
      return type.primitive === "null" ? "null" : PRIMITIVE_MAP.javascript[type.primitive];
    case "array":
      return `Array<${jsDocType(type.items, type.itemNullable)}>`;
    case "object":
      return type.name;
    case "unknown":
      return "*";
  }
}

function renderJavaScript(model: CodegenModel): string {
  if (model.objectTypes.length === 0) return nonObjectRootComment("//", model.root);

  return model.objectTypes
    .map((type) => {
      const jsdocLines = type.fields.map((field) => {
        const nameText = field.optional ? `[${field.key}]` : field.key;
        return ` * @property {${jsDocType(field.type, field.nullable)}} ${nameText}`;
      });
      const ctorLines = type.fields.map(
        (field) => `    ${jsMemberExpr("this", field.key)} = ${jsMemberExpr("data", field.key)};`
      );
      return [
        "/**",
        ` * @typedef {Object} ${type.name}`,
        ...jsdocLines,
        " */",
        `export class ${type.name} {`,
        "  constructor(data) {",
        ...(ctorLines.length > 0 ? ctorLines : ["    // (no fields)"]),
        "  }",
        "}",
      ].join("\n");
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Python (dataclasses)
// ---------------------------------------------------------------------------

function pyTypeText(type: TypeModel): string {
  switch (type.kind) {
    case "primitive":
      return type.primitive === "null" ? "None" : PRIMITIVE_MAP.python[type.primitive];
    case "array": {
      const base = pyTypeText(type.items);
      return `List[${type.itemNullable ? `Optional[${base}]` : base}]`;
    }
    case "object":
      return type.name;
    case "unknown":
      return "Any";
  }
}

function renderPython(model: CodegenModel): string {
  if (model.objectTypes.length === 0) return nonObjectRootComment("#", model.root);

  const kinds = collectFieldTypeKinds(model);
  const usesOptional = model.objectTypes.some((type) => type.fields.some((field) => field.nullable || field.optional));
  const usesList = kinds.has("array");
  const usesAny = kinds.has("unknown") || kinds.has("any-primitive");

  const typingImports: string[] = [];
  if (usesOptional) typingImports.push("Optional");
  if (usesList) typingImports.push("List");
  if (usesAny) typingImports.push("Any");

  const header = ["from dataclasses import dataclass"];
  if (typingImports.length > 0) header.push(`from typing import ${typingImports.join(", ")}`);

  const blocks = model.objectTypes.map((type) => {
    // Fields with a default (`= None`) must follow fields without one, or Python raises a SyntaxError.
    const required = type.fields.filter((field) => !field.nullable && !field.optional);
    const withDefault = type.fields.filter((field) => field.nullable || field.optional);

    const renderField = (field: FieldModel) => {
      const pyName = toSnakeCase(field.key) || "value";
      const base = pyTypeText(field.type);
      const isOptional = field.nullable || field.optional;
      const typeText = isOptional ? `Optional[${base}]` : base;
      const suffix = isOptional ? " = None" : "";
      const comment = pyName !== field.key ? `  # JSON key: "${field.key}"` : "";
      return `    ${pyName}: ${typeText}${suffix}${comment}`;
    };

    const lines = [...required, ...withDefault].map(renderField);
    return ["@dataclass", `class ${type.name}:`, ...(lines.length > 0 ? lines : ["    pass"])].join("\n");
  });

  return [header.join("\n"), blocks.join("\n\n\n")].join("\n\n\n");
}

// ---------------------------------------------------------------------------
// C#
// ---------------------------------------------------------------------------

function csTypeText(type: TypeModel, nullable: boolean): string {
  const base = csBaseType(type);
  return nullable ? `${base}?` : base;
}

function csBaseType(type: TypeModel): string {
  switch (type.kind) {
    case "primitive":
      return PRIMITIVE_MAP.csharp[type.primitive];
    case "array":
      return `List<${csTypeText(type.items, type.itemNullable)}>`;
    case "object":
      return type.name;
    case "unknown":
      return "object";
  }
}

function renderCSharp(model: CodegenModel): string {
  if (model.objectTypes.length === 0) return nonObjectRootComment("//", model.root);

  const anyPropertyRenamed = model.objectTypes.some((type) =>
    type.fields.some((field) => toPascalCase(field.key) !== field.key)
  );

  const header = ["#nullable enable", "", "using System.Collections.Generic;"];
  if (anyPropertyRenamed) header.push("using System.Text.Json.Serialization;");

  const blocks = model.objectTypes.map((type) => {
    const lines = type.fields.map((field) => {
      const propName = toPascalCase(field.key) || "Value";
      const typeText = csTypeText(field.type, field.nullable || field.optional);
      const attribute = propName !== field.key ? `    [JsonPropertyName("${field.key}")]\n` : "";
      return `${attribute}    public ${typeText} ${propName} { get; set; }`;
    });
    const body = lines.length > 0 ? lines.join("\n\n") : "    // (no fields)";
    return `public class ${type.name}\n{\n${body}\n}`;
  });

  return [header.join("\n"), blocks.join("\n\n")].join("\n\n");
}

// ---------------------------------------------------------------------------
// Java
// ---------------------------------------------------------------------------

function javaTypeText(type: TypeModel, nullable: boolean): string {
  switch (type.kind) {
    case "primitive": {
      const boxed = JAVA_BOXED[type.primitive];
      return nullable && boxed ? boxed : PRIMITIVE_MAP.java[type.primitive];
    }
    case "array":
      // Generics can't hold unboxed primitives, so list elements are always boxed.
      return `List<${javaTypeText(type.items, true)}>`;
    case "object":
      return type.name;
    case "unknown":
      return "Object";
  }
}

function renderJava(model: CodegenModel): string {
  if (model.objectTypes.length === 0) return nonObjectRootComment("//", model.root);

  const anyPropertyRenamed = model.objectTypes.some((type) =>
    type.fields.some((field) => toCamelCase(field.key) !== field.key)
  );

  const imports = ["import java.util.List;"];
  if (anyPropertyRenamed) imports.push("import com.fasterxml.jackson.annotation.JsonProperty;");

  const blocks = model.objectTypes.map((type) => {
    const fieldDecls = type.fields.map((field) => {
      const propName = toCamelCase(field.key) || "value";
      const typeText = javaTypeText(field.type, field.nullable || field.optional);
      const attribute = propName !== field.key ? `    @JsonProperty("${field.key}")\n` : "";
      return `${attribute}    private ${typeText} ${propName};`;
    });

    const accessors = type.fields.flatMap((field) => {
      const propName = toCamelCase(field.key) || "value";
      const typeText = javaTypeText(field.type, field.nullable || field.optional);
      const capName = propName.charAt(0).toUpperCase() + propName.slice(1);
      return [
        `    public ${typeText} get${capName}() {`,
        `        return ${propName};`,
        "    }",
        "",
        `    public void set${capName}(${typeText} ${propName}) {`,
        `        this.${propName} = ${propName};`,
        "    }",
      ];
    });

    const body = fieldDecls.length > 0 ? [...fieldDecls, "", ...accessors].join("\n") : "    // (no fields)";
    return `public class ${type.name} {\n${body}\n}`;
  });

  return [imports.join("\n"), blocks.join("\n\n")].join("\n\n");
}

// ---------------------------------------------------------------------------
// Go
// ---------------------------------------------------------------------------

function goTypeText(type: TypeModel, nullable: boolean): string {
  const base = goBaseType(type);
  if (!nullable) return base;
  // Slices and `any` are already nil-able; a pointer only adds value for scalars and structs.
  if (type.kind === "array" || (type.kind === "primitive" && type.primitive === "any")) return base;
  return `*${base}`;
}

function goBaseType(type: TypeModel): string {
  switch (type.kind) {
    case "primitive":
      return PRIMITIVE_MAP.go[type.primitive];
    case "array":
      return `[]${goTypeText(type.items, type.itemNullable)}`;
    case "object":
      return type.name;
    case "unknown":
      return "any";
  }
}

function renderGo(model: CodegenModel): string {
  if (model.objectTypes.length === 0) return nonObjectRootComment("//", model.root);

  return model.objectTypes
    .map((type) => {
      const lines = type.fields.map((field) => {
        const goName = toPascalCase(field.key) || "Value";
        const typeText = goTypeText(field.type, field.nullable || field.optional);
        const tag = `json:"${field.key}${field.optional ? ",omitempty" : ""}"`;
        return `\t${goName} ${typeText} \`${tag}\``;
      });
      return `type ${type.name} struct {\n${lines.length > 0 ? lines.join("\n") : "\t// (no fields)"}\n}`;
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// SQL (CREATE TABLE)
// ---------------------------------------------------------------------------

function sqlPrimitiveType(type: TypeModel): string {
  return type.kind === "primitive" ? PRIMITIVE_MAP.sql[type.primitive] : "TEXT";
}

function renderCreateTable(name: string, columns: string[]): string {
  return [`CREATE TABLE ${name} (`, columns.map((column) => `  ${column}`).join(",\n"), ");"].join("\n");
}

function foreignKeyColumn(parentTable: string): string {
  return `${parentTable}_id INT NOT NULL REFERENCES ${parentTable}(id)`;
}

function emitTableForFields(
  tableName: string,
  fields: FieldModel[],
  parentTable: string | undefined,
  statements: string[]
) {
  const columns = ["id INT AUTO_INCREMENT PRIMARY KEY"];
  if (parentTable) columns.push(foreignKeyColumn(parentTable));

  const childWork: Array<() => void> = [];

  for (const field of fields) {
    const columnName = toSqlIdentifier(field.key);
    if (field.type.kind === "primitive") {
      const nullSuffix = field.nullable || field.optional ? "" : " NOT NULL";
      columns.push(`${columnName} ${sqlPrimitiveType(field.type)}${nullSuffix}`);
    } else if (field.type.kind === "unknown") {
      columns.push(`${columnName} TEXT`);
    } else if (field.type.kind === "object") {
      const objectType = field.type;
      const childTable = `${tableName}_${columnName}`;
      childWork.push(() => emitTableForFields(childTable, objectType.fields, tableName, statements));
    } else {
      const arrayType: ArrayTypeModel = field.type;
      const childTable = `${tableName}_${columnName}`;
      const item = arrayType.items;
      if (item.kind === "object") {
        childWork.push(() => emitTableForFields(childTable, item.fields, tableName, statements));
      } else {
        childWork.push(() =>
          statements.push(
            renderCreateTable(childTable, [
              "id INT AUTO_INCREMENT PRIMARY KEY",
              foreignKeyColumn(tableName),
              `value ${sqlPrimitiveType(item)}`,
            ])
          )
        );
      }
    }
  }

  statements.push(renderCreateTable(tableName, columns));
  childWork.forEach((work) => work());
}

function renderSql(model: CodegenModel, rootTableName: string): string {
  const statements: string[] = [];

  if (model.root.kind === "object") {
    emitTableForFields(rootTableName, model.root.fields, undefined, statements);
  } else if (model.root.kind === "array" && model.root.items.kind === "object") {
    emitTableForFields(rootTableName, model.root.items.fields, undefined, statements);
  } else if (model.root.kind === "array") {
    statements.push(
      renderCreateTable(rootTableName, ["id INT AUTO_INCREMENT PRIMARY KEY", `value ${sqlPrimitiveType(model.root.items)}`])
    );
  } else {
    statements.push(
      renderCreateTable(rootTableName, ["id INT AUTO_INCREMENT PRIMARY KEY", `value ${sqlPrimitiveType(model.root)}`])
    );
  }

  return [
    "-- Generated table definitions (MySQL-flavored SQL; adjust AUTO_INCREMENT/types for your database).",
    statements.join("\n\n"),
  ].join("\n\n");
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function generateCode(value: JsonValue, languageId: CodegenLanguageId, rawRootName: string): string {
  const rootName = sanitizeRootName(rawRootName, "RootObject");
  const model = buildCodegenModel(value, rootName);

  switch (languageId) {
    case "typescript":
      return renderTypeScript(model);
    case "javascript":
      return renderJavaScript(model);
    case "python":
      return renderPython(model);
    case "csharp":
      return renderCSharp(model);
    case "java":
      return renderJava(model);
    case "go":
      return renderGo(model);
    case "sql":
      return renderSql(model, toSqlIdentifier(rootName));
  }
}
