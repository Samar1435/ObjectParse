"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Download, FileWarning, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { decodeBase64ToBytes, detectAlphabet, fileToBase64, toUrlSafeBase64 } from "@/lib/base64";
import { detectBinaryFormat } from "@/lib/binary-sniff";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";
import { formatBytes } from "@/lib/utils";

interface DecodedPdf {
  url: string;
  sizeBytes: number;
}

type DecodeOutcome =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "unrecognized"; sizeBytes: number }
  | { kind: "pdf"; pdf: DecodedPdf };

function decodePdf(input: string): DecodeOutcome {
  if (!input.trim()) return { kind: "empty" };
  let bytes: Uint8Array;
  try {
    bytes = decodeBase64ToBytes(input);
  } catch {
    return { kind: "invalid" };
  }
  const format = detectBinaryFormat(bytes);
  if (format?.mime !== "application/pdf") return { kind: "unrecognized", sizeBytes: bytes.length };
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }));
  return { kind: "pdf", pdf: { url, sizeBytes: bytes.length } };
}

function Base64ToPdfDecodePanel() {
  const [input, setInput] = useState("");

  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("base64-to-pdf");
    if (restored && restored.tool === "base64-to-pdf" && restored.mode === "decode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(restored.input);
      toast.success("Restored from history");
    }
  }, []);

  const alphabet = useMemo(() => detectAlphabet(input), [input]);

  const outcome = useMemo(() => decodePdf(input), [input]);

  useEffect(() => {
    return () => {
      if (outcome.kind === "pdf") URL.revokeObjectURL(outcome.pdf.url);
    };
  }, [outcome]);

  const decodeError = outcome.kind === "invalid";
  const unrecognized = outcome.kind === "unrecognized" ? outcome.sizeBytes : null;
  const pdf = outcome.kind === "pdf" ? outcome.pdf : null;

  useHistoryRecorder(
    () => {
      if (decodeError || !input.trim() || input.length > MAX_PAYLOAD_LENGTH) return null;
      return {
        tool: "base64-to-pdf",
        label: "Base64 to PDF",
        preview: truncate(input, 80),
        payload: { tool: "base64-to-pdf", mode: "decode", input },
      };
    },
    [input, decodeError]
  );

  function handleDownload() {
    if (!pdf) return;
    const link = document.createElement("a");
    link.href = pdf.url;
    link.download = "decoded.pdf";
    link.click();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 tool-surface rounded-lg border p-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste Base64 to decode into a PDF…"
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

      {unrecognized !== null ? (
        <Alert>
          <FileWarning />
          <AlertTitle>Doesn&apos;t look like a PDF</AlertTitle>
          <AlertDescription>
            Decoded {formatBytes(unrecognized)} of data, but it doesn&apos;t start with a PDF signature. Try{" "}
            <Link href="/base64-to-file" className="underline underline-offset-2">
              Base64 to File
            </Link>{" "}
            instead.
          </AlertDescription>
        </Alert>
      ) : null}

      {pdf ? (
        <div className="flex flex-col gap-3 tool-surface rounded-lg border p-3">
          <iframe src={pdf.url} title="Decoded PDF preview" className="h-[32rem] w-full rounded border bg-white" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline">PDF document · {formatBytes(pdf.sizeBytes)}</Badge>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download />
              Download
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface PdfFileSource {
  name: string;
  standardBase64: string;
  sizeBytes: number;
  previewUrl: string;
}

function Base64ToPdfEncodePanel() {
  const [file, setFile] = useState<PdfFileSource | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useClipboard();

  useEffect(() => {
    return () => {
      if (file) URL.revokeObjectURL(file.previewUrl);
    };
  }, [file]);

  const output = useMemo(() => {
    if (!file) return "";
    return urlSafe ? toUrlSafeBase64(file.standardBase64) : file.standardBase64;
  }, [file, urlSafe]);

  async function handleFile(selected: File) {
    const { base64 } = await fileToBase64(selected);
    setFile((previous) => {
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return {
        name: selected.name,
        standardBase64: base64,
        sizeBytes: selected.size,
        previewUrl: URL.createObjectURL(selected),
      };
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) void handleFile(dropped);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) void handleFile(selected);
    event.target.value = "";
  }

  function handleRemove() {
    if (file) URL.revokeObjectURL(file.previewUrl);
    setFile(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`tool-surface flex flex-col gap-3 rounded-lg border-2 border-dashed p-3 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-transparent"
        }`}
      >
        {file ? (
          <div className="flex flex-col gap-3">
            <iframe src={file.previewUrl} title="Uploaded PDF preview" className="h-64 w-full rounded border bg-white" />
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="truncate font-medium">
                {file.name} · {formatBytes(file.sizeBytes)}
              </span>
              <Button variant="ghost" size="icon-sm" aria-label="Remove file" onClick={handleRemove}>
                <X />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Upload className="size-6" />
            Drop a PDF here, or use the upload button below.
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={urlSafe} onCheckedChange={(checked) => setUrlSafe(checked === true)} />
            URL-safe (- _ instead of + /)
          </label>
          <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileInputChange} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            Upload PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 tool-surface rounded-lg border p-3">
        <Textarea
          value={output}
          readOnly
          placeholder="Base64 output will appear here…"
          className="min-h-32 font-mono text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{output ? formatBytes(output.length) : ""}</span>
          <Button variant="outline" size="sm" disabled={!output} onClick={() => copy(output)}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Base64ToPdfTool() {
  const [tab, setTab] = useState<string>("decode");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="decode">Base64 → PDF</TabsTrigger>
        <TabsTrigger value="encode">PDF → Base64</TabsTrigger>
      </TabsList>
      <TabsContent value="decode">
        <Base64ToPdfDecodePanel />
      </TabsContent>
      <TabsContent value="encode">
        <Base64ToPdfEncodePanel />
      </TabsContent>
    </Tabs>
  );
}
