"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Download, ImageOff, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { decodeBase64ToBytes, detectAlphabet, fileToBase64, toUrlSafeBase64 } from "@/lib/base64";
import { detectBinaryFormat, isImageFormat, looksLikeSvgText } from "@/lib/binary-sniff";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";
import { formatBytes } from "@/lib/utils";

interface DecodedImage {
  url: string;
  mime: string;
  label: string;
  extension: string;
  sizeBytes: number;
}

type DecodeOutcome =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "unrecognized"; sizeBytes: number }
  | { kind: "image"; image: DecodedImage };

function decodeImage(input: string): DecodeOutcome {
  if (!input.trim()) return { kind: "empty" };
  let bytes: Uint8Array;
  try {
    bytes = decodeBase64ToBytes(input);
  } catch {
    return { kind: "invalid" };
  }
  const format = detectBinaryFormat(bytes);
  let mime = format?.mime ?? null;
  let label = format?.label ?? null;
  let extension = format?.extension ?? "bin";
  if (!mime) {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (looksLikeSvgText(text)) {
        mime = "image/svg+xml";
        label = "SVG image";
        extension = "svg";
      }
    } catch {
      // Not UTF-8 text either — falls through to "unrecognized".
    }
  }
  if (!mime || (format && !isImageFormat(format) && mime !== "image/svg+xml")) {
    return { kind: "unrecognized", sizeBytes: bytes.length };
  }
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime }));
  return { kind: "image", image: { url, mime, label: label ?? mime, extension, sizeBytes: bytes.length } };
}

function Base64ToImageDecodePanel() {
  const [input, setInput] = useState("");

  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("base64-to-image");
    if (restored && restored.tool === "base64-to-image" && restored.mode === "decode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(restored.input);
      toast.success("Restored from history");
    }
  }, []);

  const alphabet = useMemo(() => detectAlphabet(input), [input]);

  // The blob URL is created here, as part of deriving the outcome from `input`, rather than
  // in an effect — that keeps it in sync with `input` on every render, not one tick behind.
  const outcome = useMemo(() => decodeImage(input), [input]);

  // Only the previous outcome's blob URL is revoked here; the current one is already live.
  useEffect(() => {
    return () => {
      if (outcome.kind === "image") URL.revokeObjectURL(outcome.image.url);
    };
  }, [outcome]);

  const decodeError = outcome.kind === "invalid";
  const unrecognized = outcome.kind === "unrecognized" ? outcome.sizeBytes : null;
  const image = outcome.kind === "image" ? outcome.image : null;

  useHistoryRecorder(
    () => {
      if (decodeError || !input.trim() || input.length > MAX_PAYLOAD_LENGTH) return null;
      return {
        tool: "base64-to-image",
        label: "Base64 to Image",
        preview: truncate(input, 80),
        payload: { tool: "base64-to-image", mode: "decode", input },
      };
    },
    [input, decodeError]
  );

  function handleDownload() {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `decoded.${image.extension}`;
    link.click();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 tool-surface rounded-lg border p-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste Base64 to decode into an image…"
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
          <ImageOff />
          <AlertTitle>Doesn&apos;t look like a supported image format</AlertTitle>
          <AlertDescription>
            Decoded {formatBytes(unrecognized)} of data, but it doesn&apos;t match PNG, JPEG, GIF, WebP, BMP, ICO, or
            SVG. Try{" "}
            <Link href="/base64-to-file" className="underline underline-offset-2">
              Base64 to File
            </Link>{" "}
            instead.
          </AlertDescription>
        </Alert>
      ) : null}

      {image ? (
        <div className="flex flex-col gap-3 tool-surface rounded-lg border p-3">
          <div
            className="flex items-center justify-center rounded-md p-4"
            style={{
              backgroundImage:
                "repeating-conic-gradient(#8884 0% 25%, transparent 0% 50%)",
              backgroundSize: "16px 16px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="Decoded preview" className="max-h-80 max-w-full rounded" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline">
              {image.label} · {formatBytes(image.sizeBytes)}
            </Badge>
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

interface ImageFileSource {
  name: string;
  mimeType: string;
  standardBase64: string;
  sizeBytes: number;
  previewUrl: string;
}

function Base64ToImageEncodePanel() {
  const [file, setFile] = useState<ImageFileSource | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [asDataUri, setAsDataUri] = useState(true);
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
    const base64 = urlSafe ? toUrlSafeBase64(file.standardBase64) : file.standardBase64;
    return asDataUri ? `data:${file.mimeType};base64,${file.standardBase64}` : base64;
  }, [file, urlSafe, asDataUri]);

  async function handleFile(selected: File) {
    const { base64, mimeType } = await fileToBase64(selected);
    setFile((previous) => {
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      return {
        name: selected.name,
        mimeType,
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
            <div className="flex items-center justify-center rounded-md bg-muted/30 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.previewUrl} alt={file.name} className="max-h-56 max-w-full rounded" />
            </div>
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
            Drop an image here, or use the upload button below.
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={asDataUri} onCheckedChange={(checked) => setAsDataUri(checked === true)} />
              Data URI (data:image/...;base64,...)
            </label>
            <label
              className={`flex items-center gap-2 text-sm text-muted-foreground ${asDataUri ? "opacity-50" : ""}`}
            >
              <Checkbox
                checked={urlSafe}
                disabled={asDataUri}
                onCheckedChange={(checked) => setUrlSafe(checked === true)}
              />
              URL-safe (- _ instead of + /)
            </label>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            Upload image
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

export function Base64ToImageTool() {
  const [tab, setTab] = useState<string>("decode");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="decode">Base64 → Image</TabsTrigger>
        <TabsTrigger value="encode">Image → Base64</TabsTrigger>
      </TabsList>
      <TabsContent value="decode">
        <Base64ToImageDecodePanel />
      </TabsContent>
      <TabsContent value="encode">
        <Base64ToImageEncodePanel />
      </TabsContent>
    </Tabs>
  );
}
