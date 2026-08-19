"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Base64EncodePanel } from "@/components/tools/base64/base64-encode-panel";
import { Base64DecodePanel } from "@/components/tools/base64/base64-decode-panel";
import { useHistoryStore } from "@/store/history-store";

export function Base64Tool() {
  const [tab, setTab] = useState<string>(() => {
    const pending = useHistoryStore.getState().pendingRestore;
    return pending?.tool === "base64" ? pending.mode : "decode";
  });

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="encode">Encode</TabsTrigger>
        <TabsTrigger value="decode">Decode</TabsTrigger>
      </TabsList>
      <TabsContent value="encode">
        <Base64EncodePanel />
      </TabsContent>
      <TabsContent value="decode">
        <Base64DecodePanel />
      </TabsContent>
    </Tabs>
  );
}
