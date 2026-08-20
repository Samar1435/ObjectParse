"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Download, FileWarning } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { decodeBase64, detectAlphabet, getJsonHandoffState } from "@/lib/base64";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";
import { formatBytes } from "@/lib/utils";
import { InlineJsonPanel } from "@/components/tools/base64/inline-json-panel";

export function Base64DecodePanel() {
  const [input, setInput] = useState("");
  const { copied, copy } = useClipboard();

  // One-time hydration from a homepage history click.
  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("base64");
    if (restored && restored.tool === "base64" && restored.mode === "decode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(restored.input);
      toast.success("Restored from history");
    }
  }, []);

  const alphabet = useMemo(() => detectAlphabet(input), [input]);

  const decoded = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true as const, value: decodeBase64(input) };
    } catch {
      return { ok: false as const };
    }
  }, [input]);

  const textResult = decoded?.ok && decoded.value.kind === "text" ? decoded.value : null;
  const binaryResult = decoded?.ok && decoded.value.kind === "binary" ? decoded.value : null;

  useHistoryRecorder(
    () => {
      if (!decoded?.ok || !input.trim() || input.length > MAX_PAYLOAD_LENGTH) return null;
      const preview = textResult ? truncate(textResult.text, 80) : truncate(input, 80);
      return {
        tool: "base64",
        label: "Base64 decode",
        preview,
        payload: { tool: "base64", mode: "decode", input },
      };
    },
    [input, decoded, textResult]
  );
  const jsonHandoffState = textResult ? getJsonHandoffState(textResult.text) : "none";

  function handleDownload() {
    if (!binaryResult) return;
    const blob = new Blob([binaryResult.bytes as Uint8Array<ArrayBuffer>], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "decoded.bin";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border p-3 dark:bg-card">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste Base64 to decode…"
          className="min-h-40 font-mono text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatBytes(new TextEncoder().encode(input).length)}
          </span>
          {input.trim() ? (
            <Badge variant="outline">
              Detected: {alphabet === "url-safe" ? "URL-safe Base64" : "Standard Base64"}
            </Badge>
          ) : null}
        </div>
      </div>

      {decoded && !decoded.ok ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Invalid Base64 input</AlertTitle>
          <AlertDescription>
            This doesn&apos;t decode as Base64 — check for missing characters or stray whitespace.
          </AlertDescription>
        </Alert>
      ) : null}

      {textResult ? (
        <div className="flex flex-col gap-2 rounded-lg border p-3 dark:bg-card">
          <Textarea value={textResult.text} readOnly className="min-h-32 font-mono text-sm" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatBytes(new TextEncoder().encode(textResult.text).length)}
            </span>
            <Button variant="outline" size="sm" onClick={() => copy(textResult.text)}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : null}

      {textResult && jsonHandoffState !== "none" ? <InlineJsonPanel content={textResult.text} /> : null}

      {binaryResult ? (
        <Alert>
          <FileWarning />
          <AlertTitle>Binary content detected</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>This decodes to {formatBytes(binaryResult.bytes.length)} of binary data, not valid UTF-8 text.</span>
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download />
              Download file
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
