"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardPaste, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ClaimsTable } from "@/components/tools/jwt/claims-table";
import { TokenStatusBadges } from "@/components/tools/jwt/token-status-badges";
import { DecodeSelect } from "@/components/tools/auth-inspector/decode-select";
import { useClipboard } from "@/hooks/use-clipboard";
import { decodeToken } from "@/lib/jwt";
import {
  decodeValue,
  guessDecodeMethod,
  isJwtShaped,
  type DecodeMethod,
  type ResolvedToken,
} from "@/lib/auth-inspector";

const SOURCE_LABEL: Record<ResolvedToken["source"], string> = {
  localStorage: "localStorage",
  sessionStorage: "sessionStorage",
  url: "URL",
  manual: "manual paste",
};

export function TokenPanel({
  token,
  lastCheckedAt,
  onManualToken,
}: {
  token: ResolvedToken | null;
  lastCheckedAt: number | null;
  onManualToken: (value: string) => void;
}) {
  const { copied, copy } = useClipboard();
  const [manualValue, setManualValue] = useState("");
  const [decodeMethod, setDecodeMethod] = useState<DecodeMethod>("none");

  const decodedJwt = useMemo(() => {
    if (!token || !isJwtShaped(token.value)) return null;
    try {
      return decodeToken(token.value);
    } catch {
      return null;
    }
  }, [token]);

  const genericDecode = useMemo(() => {
    if (!token || decodedJwt) return null;
    return decodeValue(token.value, decodeMethod);
  }, [token, decodedJwt, decodeMethod]);

  function handleUseManual() {
    if (!manualValue.trim()) return;
    onManualToken(manualValue.trim());
    setDecodeMethod(guessDecodeMethod(manualValue.trim()));
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Token</span>
        <div className="flex flex-wrap items-center gap-2">
          {lastCheckedAt ? (
            <span className="text-xs text-muted-foreground">Checked {new Date(lastCheckedAt).toLocaleTimeString()}</span>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => token && copy(token.value)} disabled={!token}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy token"}
          </Button>
        </div>
      </div>

      {token ? (
        <>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {SOURCE_LABEL[token.source]}
              {token.key && token.source !== "manual" ? `: ${token.key}` : ""}
            </Badge>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs break-all">{token.value}</div>
        </>
      ) : (
        <Alert>
          <AlertTitle>No token captured yet</AlertTitle>
          <AlertDescription>
            {lastCheckedAt
              ? "Checked this page's storage and URL when it loaded, but didn't find a token. Try setting the exact token key name above, or paste it manually below."
              : "Click Login above and sign in. If the site redirects back here when it's done, the token shows up automatically — otherwise paste it manually below."}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5 border-t pt-3">
        <label className="text-sm font-medium">Or paste a token manually</label>
        <div className="flex flex-wrap items-center gap-2">
          <Textarea
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="Paste a token, cookie value, or any string to decode…"
            className="min-h-16 flex-1 font-mono text-xs"
          />
          <Button variant="outline" size="sm" onClick={handleUseManual} disabled={!manualValue.trim()}>
            <ClipboardPaste />
            Use this value
          </Button>
        </div>
      </div>

      {token ? (
        <div className="flex flex-col gap-3 border-t pt-3">
          <span className="text-sm font-medium">Decode</span>
          {decodedJwt ? (
            <Tabs defaultValue="claims">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="claims">Claims</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>
                <TokenStatusBadges decoded={decodedJwt} />
              </div>
              <TabsContent value="claims" className="flex flex-col gap-3">
                <ClaimsTable title="Header" accentClassName="text-red-500" entries={decodedJwt.headerClaims} searchTerm="" />
                <ClaimsTable title="Payload" accentClassName="text-violet-500" entries={decodedJwt.payloadClaims} searchTerm="" />
              </TabsContent>
              <TabsContent value="raw">
                <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
                  {JSON.stringify({ header: decodedJwt.header, payload: decodedJwt.payload }, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Decode as</span>
                <DecodeSelect value={decodeMethod} onChange={setDecodeMethod} />
              </div>
              {genericDecode?.ok ? (
                <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs break-all whitespace-pre-wrap">
                  {genericDecode.output}
                </pre>
              ) : genericDecode?.error ? (
                <Alert variant="destructive">
                  <AlertTitle>Couldn&apos;t decode</AlertTitle>
                  <AlertDescription>{genericDecode.error}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
