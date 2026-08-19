"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JwtDecodePanel } from "@/components/tools/jwt/jwt-decode-panel";
import { JwtEncodePanel } from "@/components/tools/jwt/jwt-encode-panel";
import { useHistoryStore } from "@/store/history-store";

export function JwtTool() {
  const [tab, setTab] = useState<string>(() => {
    const pending = useHistoryStore.getState().pendingRestore;
    return pending?.tool === "jwt" ? pending.mode : "decode";
  });

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="decode">Decode</TabsTrigger>
        <TabsTrigger value="encode">Encode</TabsTrigger>
      </TabsList>
      <TabsContent value="decode">
        <JwtDecodePanel />
      </TabsContent>
      <TabsContent value="encode">
        <JwtEncodePanel />
      </TabsContent>
    </Tabs>
  );
}
