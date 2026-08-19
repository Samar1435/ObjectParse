"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { Check, Copy, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { encodeTextToBase64, fileToBase64, toUrlSafeBase64 } from "@/lib/base64";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";
import { formatBytes } from "@/lib/utils";

interface FileSource {
  name: string;
  standardBase64: string;
  sizeBytes: number;
}

export function Base64EncodePanel() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<FileSource | null>(null);
  const [urlSafe, setUrlSafe] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useClipboard();

  // One-time hydration from history — restores a previous encode session when the user
  // clicked into this tool from the homepage's recent-activity list.
  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("base64");
    if (restored && restored.tool === "base64" && restored.mode === "encode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(restored.text);
      setUrlSafe(restored.urlSafe);
      toast.success("Restored from history");
    }
  }, []);

  useHistoryRecorder(
    () => {
      if (file || !text.trim() || text.length > MAX_PAYLOAD_LENGTH) return null;
      return {
        tool: "base64",
        label: "Base64 encode",
        preview: truncate(text, 80),
        payload: { tool: "base64", mode: "encode", text, urlSafe },
      };
    },
    [text, urlSafe, file]
  );

  const output = useMemo(() => {
    if (file) return urlSafe ? toUrlSafeBase64(file.standardBase64) : file.standardBase64;
    if (!text) return "";
    return encodeTextToBase64(text, { urlSafe });
  }, [file, text, urlSafe]);

  const inputSizeBytes = file ? file.sizeBytes : new TextEncoder().encode(text).length;

  async function handleFile(selected: File) {
    const { base64 } = await fileToBase64(selected);
    setFile({ name: selected.name, standardBase64: base64, sizeBytes: selected.size });
    setText("");
  }

  function handleTextChange(value: string) {
    setText(value);
    if (file) setFile(null);
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

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col gap-2 rounded-lg border-2 border-dashed p-2 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-transparent"
        }`}
      >
        {file ? (
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="truncate font-medium">{file.name}</span>
            <Button variant="ghost" size="icon-sm" aria-label="Remove file" onClick={() => setFile(null)}>
              <X />
            </Button>
          </div>
        ) : (
          <Textarea
            value={text}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder="Paste text to encode, or drop a file here…"
            className="min-h-40 font-mono text-sm"
          />
        )}
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={urlSafe} onCheckedChange={(checked) => setUrlSafe(checked === true)} />
            URL-safe (- _ instead of + /)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatBytes(inputSizeBytes)}</span>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload />
              Upload file
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
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
