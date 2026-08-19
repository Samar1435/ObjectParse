"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorsList } from "@/components/tools/json/errors-list";
import { StatsPanel } from "@/components/tools/json/stats-panel";
import { SearchPanel, type SearchMatchWithRange, type SearchResultWithRanges } from "@/components/tools/json/search-panel";
import type { JsonDiagnostic, JsonValue, ParseResult, SearchMode } from "@/lib/json";

export function ResultsPanel({
  parseResult,
  rawText,
  activeTab,
  onActiveTabChange,
  searchTerm,
  searchMode,
  onSearchModeChange,
  searchMatchCase,
  onSearchMatchCaseChange,
  searchResult,
  activeMatchKey,
  onJumpToDiagnostic,
  onJumpToMatch,
}: {
  parseResult: ParseResult | null;
  rawText: string;
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  searchTerm: string;
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  searchMatchCase: boolean;
  onSearchMatchCaseChange: (matchCase: boolean) => void;
  searchResult: SearchResultWithRanges | null;
  activeMatchKey: string | null;
  onJumpToDiagnostic: (diagnostic: JsonDiagnostic) => void;
  onJumpToMatch: (match: SearchMatchWithRange) => void;
}) {
  const diagnostics = parseResult?.diagnostics ?? [];
  const value: JsonValue | undefined = parseResult?.value;

  return (
    <Tabs value={activeTab} onValueChange={onActiveTabChange} className="flex h-full flex-col">
      <TabsList>
        <TabsTrigger value="errors">Errors{diagnostics.length > 0 ? ` (${diagnostics.length})` : ""}</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="search">Search{searchResult ? ` (${searchResult.matches.length})` : ""}</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto py-2">
        <TabsContent value="errors">
          <ErrorsList diagnostics={diagnostics} onJump={onJumpToDiagnostic} />
        </TabsContent>
        <TabsContent value="stats">
          <StatsPanel value={value} rawText={rawText} />
        </TabsContent>
        <TabsContent value="search">
          <SearchPanel
            hasValue={value !== undefined}
            term={searchTerm}
            mode={searchMode}
            onModeChange={onSearchModeChange}
            matchCase={searchMatchCase}
            onMatchCaseChange={onSearchMatchCaseChange}
            result={searchResult}
            activeKey={activeMatchKey}
            onJump={onJumpToMatch}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
