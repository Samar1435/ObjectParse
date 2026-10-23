"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { CodeEditor } from "@/components/editor/code-editor";
import { CopyIconButton } from "@/components/tools/jwt/copy-icon-button";
import { CODEGEN_LANGUAGES, generateCode, type CodegenLanguageId, type JsonValue } from "@/lib/json";

export function CodegenPanel({
  value,
  languageId,
}: {
  value: JsonValue | undefined;
  languageId: CodegenLanguageId;
}) {
  const [rootName, setRootName] = useState("RootObject");

  const activeLanguage = CODEGEN_LANGUAGES.find((lang) => lang.id === languageId) ?? CODEGEN_LANGUAGES[0];

  const generated = useMemo(() => {
    if (value === undefined) return "";
    try {
      return generateCode(value, languageId, rootName);
    } catch {
      return "// Could not generate code for this document.";
    }
  }, [value, languageId, rootName]);

  if (value === undefined) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nothing to convert yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        {activeLanguage.id === "sql" ? "Table name" : "Class name"}
        <Input value={rootName} onChange={(event) => setRootName(event.target.value)} placeholder="RootObject" />
      </label>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase">{activeLanguage.label}</span>
        <CopyIconButton value={generated} label="generated code" />
      </div>
      <div className="h-64 overflow-hidden rounded-lg border">
        <CodeEditor value={generated} language={activeLanguage.monacoLanguage} readOnly />
      </div>
    </div>
  );
}
