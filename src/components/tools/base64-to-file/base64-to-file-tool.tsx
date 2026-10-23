"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { decodeBase64ToBytes, detectAlphabet, getJsonHandoffState } from "@/lib/base64";
import { Base64EncodePanel } from "@/components/tools/base64/base64-encode-panel";
import { detectBinaryFormat, looksLikeSvgText } from "@/lib/binary-sniff";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";
import { formatBytes } from "@/lib/utils";

interface DetectedFile {
  bytes: Uint8Array;
  mime: string;
  extension: string;
  label: string;
  url: string;
  text: string | null;
}

function detectFile(bytes: Uint8Array): Omit<DetectedFile, "url"> {
  const format = detectBinaryFormat(bytes);
  if (format) return { bytes, mime: format.mime, extension: format.extension, label: format.label, text: null };

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (getJsonHandoffState(text) !== "none") {
      return { bytes, mime: "application/json", extension: "json", label: "JSON text", text };
    }
    if (looksLikeSvgText(text)) {
      return { bytes, mime: "image/svg+xml", extension: "svg", label: "SVG image", text };
    }
    return { bytes, mime: "text/plain", extension: "txt", label: "Plain text", text };
  } catch {
    return { bytes, mime: "application/octet-stream", extension: "bin", label: "Unknown binary data", text: null };
  }
}

type DecodeOutcome = { kind: "empty" } | { kind: "invalid" } | { kind: "file"; file: DetectedFile };

function decodeFile(input: string): DecodeOutcome {
  if (!input.trim()) return { kind: "empty" };
  try {
    const bytes = decodeBase64ToBytes(input);
    const info = detectFile(bytes);
    const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: info.mime }));
    return { kind: "file", file: { ...info, url } };
  } catch {
    return { kind: "invalid" };
  }
}

function Base64ToFileDecodePanel() {
  const [input, setInput] = useState("");
  const fileNameRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useClipboard();

  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("base64-to-file");
    if (restored && restored.tool === "base64-to-file" && restored.mode === "decode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(restored.input);
      toast.success("Restored from history");
    }
  }, []);

  const alphabet = useMemo(() => detectAlphabet(input), [input]);

  const outcome = useMemo(() => decodeFile(input), [input]);

  useEffect(() => {
    return () => {
      if (outcome.kind === "file") URL.revokeObjectURL(outcome.file.url);
    };
  }, [outcome]);

  const decodeError = outcome.kind === "invalid";
  const detected = outcome.kind === "file" ? outcome.file : null;

  useHistoryRecorder(
    () => {
      if (decodeError || !input.trim() || input.length > MAX_PAYLOAD_LENGTH) return null;
      return {
        tool: "base64-to-file",
        label: "Base64 to File",
        preview: truncate(input, 80),
        payload: { tool: "base64-to-file", mode: "decode", input },
      };
    },
    [input, decodeError]
  );

  const defaultName = detected ? `decoded.${detected.extension}` : "";

  function handleDownload() {
    if (!detected) return;
    const link = document.createElement("a");
    link.href = detected.url;
    link.download = fileNameRef.current?.value || defaultName;
    link.click();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 tool-surface rounded-lg border p-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste Base64 to decode into a file…"
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

      {decodeError ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Invalid Base64 input</AlertTitle>
          <AlertDescription>
            This doesn&apos;t decode as Base64 — check for missing characters or stray whitespace.
          </AlertDescription>
        </Alert>
      ) : null}

      {detected ? (
        <div className="flex flex-col gap-3 tool-surface rounded-lg border p-3">
          <Badge variant="outline">
            {detected.label} · {detected.mime} · {formatBytes(detected.bytes.length)}
          </Badge>

          {detected.mime.startsWith("image/") ? (
            <div className="flex items-center justify-center rounded-md bg-muted/30 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={detected.url} alt="Decoded preview" className="max-h-72 max-w-full rounded" />
            </div>
          ) : null}

          {detected.mime === "application/pdf" ? (
            <iframe src={detected.url} title="Decoded PDF preview" className="h-96 w-full rounded border bg-white" />
          ) : null}

          {detected.text !== null && !detected.mime.startsWith("image/") ? (
            <Textarea value={detected.text} readOnly className="min-h-40 font-mono text-sm" />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Input
              key={detected.url}
              ref={fileNameRef}
              defaultValue={defaultName}
              className="max-w-56 font-mono text-sm"
              aria-label="Download file name"
            />
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download />
              Download
            </Button>
            {detected.text !== null ? (
              <Button variant="outline" size="sm" onClick={() => copy(detected.text ?? "")}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy text"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Base64ToFileTool() {
  const [tab, setTab] = useState<string>("decode");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="decode">Base64 → File</TabsTrigger>
        <TabsTrigger value="encode">File → Base64</TabsTrigger>
      </TabsList>
      <TabsContent value="decode">
        <Base64ToFileDecodePanel />
      </TabsContent>
      <TabsContent value="encode">
        <Base64EncodePanel />
      </TabsContent>
    </Tabs>
  );
}
