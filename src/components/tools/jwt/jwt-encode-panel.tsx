"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, KeySquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/editor/code-editor";
import { useClipboard } from "@/hooks/use-clipboard";
import { AlgorithmSelect } from "@/components/tools/jwt/algorithm-select";
import { KeyInput } from "@/components/tools/jwt/key-input";
import { useMediaQuery } from "@/hooks/use-media-query";
import { signToken, type JwtAlgorithm, type SignResult } from "@/lib/jwt";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHistoryStore } from "@/store/history-store";

export function JwtEncodePanel() {
  const [alg, setAlg] = useState<JwtAlgorithm>("HS256");
  const [headerJson, setHeaderJson] = useState(() => JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2));
  const [payloadJson, setPayloadJson] = useState(() =>
    JSON.stringify({ sub: "1234567890", name: "John Doe", iat: Math.floor(Date.now() / 1000) }, null, 2)
  );
  const [keyMaterial, setKeyMaterial] = useState("");
  const [signResult, setSignResult] = useState<SignResult | null>(null);
  const [signing, setSigning] = useState(false);
  const { copied, copy } = useClipboard();
  const record = useHistoryStore((state) => state.record);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // One-time hydration from a homepage history click. The signing key is never persisted to
  // history (it can be a secret or private key), so only header/payload/alg are restored.
  useEffect(() => {
    const restored = useHistoryStore.getState().consumeRestore("jwt");
    if (restored && restored.tool === "jwt" && restored.mode === "encode") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAlg(restored.alg);
      setHeaderJson(restored.headerJson);
      setPayloadJson(restored.payloadJson);
      toast.success("Restored from history");
    }
  }, []);

  function handleAlgChange(next: JwtAlgorithm) {
    setAlg(next);
    try {
      const parsedHeader = JSON.parse(headerJson);
      setHeaderJson(JSON.stringify({ ...parsedHeader, alg: next }, null, 2));
    } catch {
      // Leave the header text alone if it's mid-edit and not valid JSON right now —
      // signToken always uses the selected algorithm regardless of what's on screen.
    }
  }

  async function handleGenerate() {
    setSigning(true);
    const result = await signToken(headerJson, payloadJson, alg, keyMaterial);
    setSignResult(result);
    setSigning(false);
    if (result.token && headerJson.length + payloadJson.length <= MAX_PAYLOAD_LENGTH) {
      record({
        id: crypto.randomUUID(),
        tool: "jwt",
        label: "JWT encode",
        preview: truncate(payloadJson, 80),
        payload: { tool: "jwt", mode: "encode", alg, headerJson, payloadJson },
      });
    }
  }

  const headerElement = (
    <div className="flex h-full flex-col gap-1.5 p-3">
      <span className="text-xs font-medium text-red-500 uppercase">Header</span>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <CodeEditor value={headerJson} onChange={setHeaderJson} language="json" />
      </div>
    </div>
  );

  const payloadElement = (
    <div className="flex h-full flex-col gap-1.5 p-3">
      <span className="text-xs font-medium text-violet-500 uppercase">Payload</span>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <CodeEditor value={payloadJson} onChange={setPayloadJson} language="json" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Algorithm</span>
        <AlgorithmSelect value={alg} onChange={handleAlgChange} />
      </div>

      {/* Fixed height, not min-height: the code editors below only clip internally once their
          ancestor chain is a definite size, else long JSON grows the whole page instead of
          scrolling in place. */}
      {isDesktop ? (
        <div className="h-72">
          <ResizablePanelGroup orientation="horizontal" className="rounded-lg border">
            <ResizablePanel defaultSize="50" minSize="30">
              {headerElement}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="50" minSize="30">
              {payloadElement}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      ) : (
        <div className="h-72">
          <Tabs defaultValue="header" className="flex h-full flex-col">
            <TabsList>
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="payload">Payload</TabsTrigger>
            </TabsList>
            <TabsContent value="header" className="rounded-lg border">
              {headerElement}
            </TabsContent>
            <TabsContent value="payload" className="rounded-lg border">
              {payloadElement}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <KeyInput alg={alg} usage="sign" value={keyMaterial} onChange={setKeyMaterial} />

      <Button onClick={handleGenerate} disabled={signing} className="self-start">
        <KeySquare />
        {signing ? "Signing…" : "Generate token"}
      </Button>

      {signResult?.error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Couldn&apos;t generate a token</AlertTitle>
          <AlertDescription>{signResult.error}</AlertDescription>
        </Alert>
      ) : null}

      {signResult?.token ? (
        <div className="flex flex-col gap-2">
          <Textarea readOnly value={signResult.token} className="min-h-32 font-mono text-xs" />
          <Button variant="outline" size="sm" onClick={() => copy(signResult.token ?? "")} className="self-start">
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy token"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
