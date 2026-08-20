"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, CheckCircle2, Copy, RotateCcw, Sparkles, Terminal, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CodeEditor } from "@/components/editor/code-editor";
import { AlgorithmSelect } from "@/components/tools/jwt/algorithm-select";
import { ClaimsSearchBox } from "@/components/tools/jwt/claims-search-box";
import { ClaimsTable } from "@/components/tools/jwt/claims-table";
import { CopyIconButton } from "@/components/tools/jwt/copy-icon-button";
import { KeyInput } from "@/components/tools/jwt/key-input";
import { TokenStatusBadges } from "@/components/tools/jwt/token-status-badges";
import { useClipboard } from "@/hooks/use-clipboard";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { decodeToken, isSupportedAlgorithm, verifyToken, type JwtAlgorithm, type JwtParts, type VerifyResult } from "@/lib/jwt";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";

const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

function TokenSegmentButton({ value, label, className }: { value: string; label: string; className: string }) {
  const { copied, copy } = useClipboard();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => copy(value)}
          className={cn("rounded transition-colors hover:bg-foreground/10", className)}
        >
          {value}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : `Copy ${label}`}</TooltipContent>
    </Tooltip>
  );
}

function ColorizedToken({ parts }: { parts: JwtParts }) {
  return (
    <div className="max-h-28 overflow-y-auto rounded-lg border bg-muted/30 p-2 font-mono text-xs break-all">
      <TokenSegmentButton value={parts.headerSegment} label="header" className="text-red-500" />
      <span className="text-muted-foreground">.</span>
      <TokenSegmentButton value={parts.payloadSegment} label="payload" className="text-violet-500" />
      <span className="text-muted-foreground">.</span>
      <TokenSegmentButton value={parts.signatureSegment} label="signature" className="text-sky-500" />
    </div>
  );
}

function IconActionButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function JwtDecodePanel() {
  const [token, setToken] = useState("");
  const [verifyAlg, setVerifyAlg] = useState<JwtAlgorithm>("HS256");
  const [keyMaterial, setKeyMaterial] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { copied: tokenCopied, copy: copyToken } = useClipboard();
  const { copied: bearerCopied, copy: copyBearer } = useClipboard();
  const initialTokenRef = useRef(token);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // One-time hydration from a homepage history click. The verify key is never persisted to
  // history (it can be a secret or private key), so only the token itself is restored.
  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("jwt");
    if (restored && restored.tool === "jwt" && restored.mode === "decode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(restored.token);
      toast.success("Restored from history");
    }
  }, []);

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    try {
      return { ok: true as const, value: decodeToken(token) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Couldn't decode this token." };
    }
  }, [token]);

  const decodedValue = decoded?.ok ? decoded.value : null;
  const headerAlg = decodedValue?.header.alg;
  const headerAlgUsable = headerAlg !== undefined && isSupportedAlgorithm(headerAlg) ? headerAlg : null;

  useHistoryRecorder(
    () => {
      if (!decodedValue || token === initialTokenRef.current || token.length > MAX_PAYLOAD_LENGTH) return null;
      return {
        tool: "jwt",
        label: "JWT decode",
        preview: truncate(token, 60),
        payload: { tool: "jwt", mode: "decode", token },
      };
    },
    [token, decodedValue]
  );

  const searchSuggestions = useMemo(() => {
    if (!decodedValue) return [];
    const keys = new Set([...decodedValue.headerClaims, ...decodedValue.payloadClaims].map((claim) => claim.key));
    return Array.from(keys);
  }, [decodedValue]);

  function handleTokenChange(next: string) {
    setToken(next);
    setVerifyResult(null);
  }

  function handleLoadSample() {
    handleTokenChange(SAMPLE_TOKEN);
    setSearchTerm("");
  }

  function handleClear() {
    handleTokenChange("");
    setSearchTerm("");
  }

  async function handleVerify() {
    if (!decodedValue) return;
    setVerifying(true);
    setVerifyResult(await verifyToken(token, verifyAlg, keyMaterial));
    setVerifying(false);
  }

  const encodedElement = (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Encoded</span>
        <div className="flex items-center gap-1">
          <IconActionButton label="Load sample" onClick={handleLoadSample} icon={<Sparkles />} />
          <IconActionButton label="Clear" onClick={handleClear} disabled={!token} icon={<RotateCcw />} />
        </div>
      </div>

      <Textarea
        value={token}
        onChange={(event) => handleTokenChange(event.target.value)}
        placeholder="Paste a JWT to decode…"
        className="min-h-0 flex-1 resize-none font-mono text-xs"
      />

      {decodedValue ? <ColorizedToken parts={decodedValue.parts} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
        <span className="text-xs text-muted-foreground">
          {token.trim() ? `${token.trim().length} characters` : "Paste or load a token"}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => copyToken(token)} disabled={!token}>
            {tokenCopied ? <Check /> : <Copy />}
            {tokenCopied ? "Copied" : "Copy token"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyBearer(`Bearer ${token}`)} disabled={!token}>
            {bearerCopied ? <Check /> : <Terminal />}
            {bearerCopied ? "Copied" : "Bearer"}
          </Button>
        </div>
      </div>
    </div>
  );

  const decodedElement = (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Decoded</span>
        {decodedValue ? <TokenStatusBadges decoded={decodedValue} /> : null}
      </div>

      {decoded && !decoded.ok ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Couldn&apos;t decode this token</AlertTitle>
          <AlertDescription>{decoded.error}</AlertDescription>
        </Alert>
      ) : decodedValue ? (
        <Tabs defaultValue="claims" className="flex flex-1 flex-col gap-2">
          <TabsList>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="claims" className="pr-1">
            <ClaimsSearchBox value={searchTerm} onChange={setSearchTerm} suggestions={searchSuggestions} sticky />
            <div className="flex flex-col gap-3 pt-2">
              <ClaimsTable
                title="Header"
                accentClassName="text-red-500"
                entries={decodedValue.headerClaims}
                searchTerm={searchTerm}
              />
              <ClaimsTable
                title="Payload"
                accentClassName="text-violet-500"
                entries={decodedValue.payloadClaims}
                searchTerm={searchTerm}
              />
            </div>
          </TabsContent>
          <TabsContent value="raw" className="flex flex-col gap-3 pr-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-red-500 uppercase">Header</span>
                <CopyIconButton value={JSON.stringify(decodedValue.header, null, 2)} label="header JSON" />
              </div>
              <div className="h-40 overflow-hidden rounded-lg border">
                <CodeEditor value={JSON.stringify(decodedValue.header, null, 2)} language="json" readOnly />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-violet-500 uppercase">Payload</span>
                <CopyIconButton value={JSON.stringify(decodedValue.payload, null, 2)} label="payload JSON" />
              </div>
              <div className="h-40 overflow-hidden rounded-lg border">
                <CodeEditor value={JSON.stringify(decodedValue.payload, null, 2)} language="json" readOnly />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
          Paste a token to see the decoded output.
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Fixed height, not min-height: the code editors and overflow-y-auto areas below only
          clip internally once their ancestor chain is a definite size, else a long token or
          payload grows the whole page instead of scrolling in place. */}
      {isDesktop ? (
        <div className="h-[30rem]">
          <ResizablePanelGroup orientation="horizontal" className="rounded-lg border dark:bg-card">
            <ResizablePanel defaultSize="50" minSize="30">
              <div className="h-full overflow-y-auto p-3 dark:bg-card">{encodedElement}</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="50" minSize="30">
              <div className="h-full overflow-y-auto p-3 dark:bg-card">{decodedElement}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      ) : (
        <div className="h-[30rem]">
          <Tabs defaultValue="encoded" className="flex h-full flex-col">
            <TabsList>
              <TabsTrigger value="encoded">Encoded</TabsTrigger>
              <TabsTrigger value="decoded">Decoded</TabsTrigger>
            </TabsList>
            <TabsContent value="encoded" className="flex-1 rounded-lg border dark:bg-card">
              {encodedElement}
            </TabsContent>
            <TabsContent value="decoded" className="flex-1 rounded-lg border dark:bg-card">
              {decodedElement}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {decodedValue ? (
        <div className="flex flex-col gap-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Verify signature</span>
            <div className="flex items-center gap-2">
              {headerAlgUsable && headerAlgUsable !== verifyAlg ? (
                <Button variant="ghost" size="sm" onClick={() => setVerifyAlg(headerAlgUsable)}>
                  Token header says {headerAlgUsable} — use it
                </Button>
              ) : null}
              <AlgorithmSelect value={verifyAlg} onChange={setVerifyAlg} />
            </div>
          </div>
          <KeyInput alg={verifyAlg} usage="verify" value={keyMaterial} onChange={setKeyMaterial} />
          <Button size="sm" onClick={handleVerify} disabled={verifying} className="self-start">
            {verifying ? "Verifying…" : "Verify signature"}
          </Button>
          {verifyResult ? (
            <Alert variant={verifyResult.valid && !verifyResult.expired ? "default" : "destructive"}>
              {verifyResult.valid && !verifyResult.expired ? <CheckCircle2 /> : <XCircle />}
              <AlertTitle>
                {verifyResult.valid ? (verifyResult.expired ? "Valid signature, expired token" : "Valid signature") : "Invalid signature"}
              </AlertTitle>
              <AlertDescription>{verifyResult.message}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
