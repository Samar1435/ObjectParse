"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClipboard } from "@/hooks/use-clipboard";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import {
  bytesToHexDump,
  bytesToPlainHex,
  decodeBase64ToBytes,
  detectAlphabet,
  encodeBytesToBase64,
  hexToBytes,
} from "@/lib/base64";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";
import { formatBytes } from "@/lib/utils";

const HEX_DUMP_BYTES_PER_LINE = 16;
const HEX_DUMP_PREVIEW_BYTES = 16 * 1024;

function Base64ToHexDecodePanel() {
  const [input, setInput] = useState("");
  const { copied, copy } = useClipboard();

  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("base64-to-hex");
    if (restored && restored.tool === "base64-to-hex" && restored.mode === "decode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(restored.input);
      toast.success("Restored from history");
    }
  }, []);

  const alphabet = useMemo(() => detectAlphabet(input), [input]);

  const decoded = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true as const, bytes: decodeBase64ToBytes(input) };
    } catch {
      return { ok: false as const };
    }
  }, [input]);

  const bytes = decoded?.ok ? decoded.bytes : null;
  const plainHex = useMemo(() => (bytes ? bytesToPlainHex(bytes) : ""), [bytes]);
  const dump = useMemo(() => {
    if (!bytes) return "";
    const truncated = bytes.length > HEX_DUMP_PREVIEW_BYTES;
    const preview = bytesToHexDump(truncated ? bytes.subarray(0, HEX_DUMP_PREVIEW_BYTES) : bytes, HEX_DUMP_BYTES_PER_LINE);
    return truncated ? `${preview}\n… truncated, showing first ${formatBytes(HEX_DUMP_PREVIEW_BYTES)} of ${formatBytes(bytes.length)}` : preview;
  }, [bytes]);

  useHistoryRecorder(
    () => {
      if (!decoded?.ok || !input.trim() || input.length > MAX_PAYLOAD_LENGTH) return null;
      return {
        tool: "base64-to-hex",
        label: "Base64 to Hex",
        preview: truncate(input, 80),
        payload: { tool: "base64-to-hex", mode: "decode", input },
      };
    },
    [input, decoded]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 tool-surface rounded-lg border p-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste Base64 to decode into hex…"
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

      {bytes ? (
        <div className="flex flex-col gap-2 tool-surface rounded-lg border p-3">
          <pre className="max-h-96 overflow-auto rounded bg-muted/30 p-3 font-mono text-xs leading-relaxed">{dump}</pre>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatBytes(bytes.length)}</span>
            <Button variant="outline" size="sm" onClick={() => copy(plainHex)}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy plain hex"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Base64ToHexEncodePanel() {
  const [hex, setHex] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const { copied, copy } = useClipboard();

  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("base64-to-hex");
    if (restored && restored.tool === "base64-to-hex" && restored.mode === "encode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHex(restored.hex);
      toast.success("Restored from history");
    }
  }, []);

  const converted = useMemo(() => {
    if (!hex.trim()) return null;
    try {
      return { ok: true as const, bytes: hexToBytes(hex) };
    } catch {
      return { ok: false as const };
    }
  }, [hex]);

  const output = useMemo(() => {
    if (!converted?.ok) return "";
    return encodeBytesToBase64(converted.bytes, { urlSafe });
  }, [converted, urlSafe]);

  useHistoryRecorder(
    () => {
      if (!converted?.ok || !hex.trim() || hex.length > MAX_PAYLOAD_LENGTH) return null;
      return {
        tool: "base64-to-hex",
        label: "Hex to Base64",
        preview: truncate(hex, 80),
        payload: { tool: "base64-to-hex", mode: "encode", hex },
      };
    },
    [hex, converted]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 tool-surface rounded-lg border p-3">
        <Textarea
          value={hex}
          onChange={(event) => setHex(event.target.value)}
          placeholder="Paste hex to encode to Base64… (spaces, colons, and dashes are ignored)"
          className="min-h-40 font-mono text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={urlSafe} onCheckedChange={(checked) => setUrlSafe(checked === true)} />
            URL-safe (- _ instead of + /)
          </label>
          <span className="text-xs text-muted-foreground">
            {converted?.ok ? formatBytes(converted.bytes.length) : ""}
          </span>
        </div>
      </div>

      {converted && !converted.ok ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Invalid hex input</AlertTitle>
          <AlertDescription>
            Hex must contain only 0-9 and a-f/A-F characters, in complete byte pairs.
          </AlertDescription>
        </Alert>
      ) : null}

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

export function Base64ToHexTool() {
  const [tab, setTab] = useState<string>(() => {
    const pending = useHistoryStore.getState().pendingRestore;
    return pending?.tool === "base64-to-hex" ? pending.mode : "decode";
  });

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="decode">Base64 → Hex</TabsTrigger>
        <TabsTrigger value="encode">Hex → Base64</TabsTrigger>
      </TabsList>
      <TabsContent value="decode">
        <Base64ToHexDecodePanel />
      </TabsContent>
      <TabsContent value="encode">
        <Base64ToHexEncodePanel />
      </TabsContent>
    </Tabs>
  );
}
