"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.Editor), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

function EditorSkeleton() {
  return (
    <div className="flex size-full min-h-32 animate-pulse items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      Loading editor…
    </div>
  );
}

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string | number;
  onMount?: OnMount;
  options?: editor.IStandaloneEditorConstructionOptions;
}

export function CodeEditor({
  value,
  onChange,
  language = "json",
  readOnly = false,
  height = "100%",
  onMount,
  options,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <MonacoEditor
      value={value}
      onChange={(next) => onChange?.(next ?? "")}
      language={language}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      height={height}
      onMount={onMount}
      options={{ minimap: { enabled: false }, fontSize: 13, ...options, readOnly }}
    />
  );
}
