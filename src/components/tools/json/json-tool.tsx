"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findNodeAtLocation, parseTree, type Node as JsoncNode } from "jsonc-parser";
import type { OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNs, Position as MonacoPosition } from "monaco-editor";
import { toast } from "sonner";
import { Braces, ChevronDown, ChevronUp, Minimize2, SortAsc, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { CodeEditor } from "@/components/editor/code-editor";
import { JsonSearchBox } from "@/components/tools/json/json-search-box";
import { ResultsPanel } from "@/components/tools/json/results-panel";
import { RepairDialog } from "@/components/tools/json/repair-dialog";
import { matchKey, type SearchMatchWithRange, type SearchResultWithRanges } from "@/components/tools/json/search-panel";
import { CopyIconButton } from "@/components/tools/jwt/copy-icon-button";
import { useJsonEngine } from "@/hooks/use-json-engine";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";
import { useMediaQuery } from "@/hooks/use-media-query";
import { truncate, MAX_PAYLOAD_LENGTH } from "@/lib/history";
import { useHandoffStore } from "@/store/handoff-store";
import { useHistoryStore } from "@/store/history-store";
import {
  buildLineStartIndex,
  collectSearchSuggestions,
  formatJson,
  minifyJson,
  offsetToRange,
  pointerToSegments,
  repairJson,
  searchJson,
  type JsonDiagnostic,
  type Position,
  type RepairResult,
  type SearchMatch,
  type SearchMode,
} from "@/lib/json";

/** For a key match, highlight/jump to the property name itself, not its value. */
function resolveMatchNode(root: JsoncNode, match: SearchMatch): JsoncNode | undefined {
  const valueNode = findNodeAtLocation(root, pointerToSegments(match.pointer));
  if (!valueNode) return undefined;
  if (match.matchedIn === "key") {
    return valueNode.parent?.children?.[0] ?? valueNode;
  }
  return valueNode;
}

/** Monaco's `.focus()` triggers the browser's native scroll-into-view, dragging the whole page along; restore the page scroll position right after so only the editor moves. */
function focusEditorPreservingPageScroll(editorInstance: MonacoEditorNs.IStandaloneCodeEditor) {
  const { scrollX, scrollY } = window;
  editorInstance.focus();
  window.scrollTo(scrollX, scrollY);
}

export function JsonTool({ initialContent }: { initialContent?: string }) {
  const [content, setContent] = useState(initialContent ?? "");
  const [repairOpen, setRepairOpen] = useState(false);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [resultsTab, setResultsTab] = useState("errors");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("both");
  const [searchMatchCase, setSearchMatchCase] = useState(false);

  const [activeMatch, setActiveMatch] = useState<SearchMatchWithRange | null>(null);

  // Desktop (resizable side-by-side) and mobile (tabbed) layouts are mutually exclusive:
  // rendering both at once behind CSS `hidden`/`md:hidden` would mount two CodeEditor
  // instances simultaneously, and editorRef would end up pointing at whichever mounted
  // last — possibly the hidden one, silently breaking search jump-to-line and highlighting.
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const editorRef = useRef<MonacoEditorNs.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const matchDecorationsRef = useRef<MonacoEditorNs.IEditorDecorationsCollection | null>(null);
  const initialContentRef = useRef(content);
  const lastActionRef = useRef("Edited JSON");

  // One-time hydration from the Base64 tool's handoff, or from a homepage history click (not a
  // derived-state anti-pattern — there is no other point to consume these external, single-use
  // payloads before first paint). Skipped when the caller supplies its own initialContent
  // directly (e.g. the inline embed on the Base64 page), which has no need for either store.
  useEffect(() => {
    if (initialContent !== undefined) return;
    const restored = useHistoryStore.getState().consumeRestore("json");
    if (restored && restored.tool === "json") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContent(restored.content);
      toast.success("Restored from history");
      return;
    }
    const payload = useHandoffStore.getState().consume();
    if (payload) {
      setContent(payload.content);
      toast.success("Loaded decoded content from Base64");
    }
  }, [initialContent]);

  useHistoryRecorder(
    () => {
      if (initialContent !== undefined) return null;
      if (!content.trim() || content === initialContentRef.current || content.length > MAX_PAYLOAD_LENGTH) {
        return null;
      }
      return {
        tool: "json",
        label: lastActionRef.current,
        preview: truncate(content, 80),
        payload: { tool: "json", content },
      };
    },
    [content, initialContent]
  );

  const parseResult = useJsonEngine(content);

  const searchResult = useMemo(() => {
    if (!searchTerm.trim() || parseResult?.value === undefined) return null;
    try {
      return searchJson(parseResult.value, { term: searchTerm, mode: searchMode, matchCase: searchMatchCase });
    } catch {
      return null;
    }
  }, [searchTerm, searchMode, searchMatchCase, parseResult]);

  // Parsed once per keystroke and shared by the match-position lookup below and by the
  // click-to-jump handler, so a search with many matches doesn't reparse the tree per match.
  const parsedTree = useMemo(() => parseTree(content), [content]);
  const lineStarts = useMemo(() => buildLineStartIndex(content), [content]);

  const enrichedSearchResult = useMemo<SearchResultWithRanges | null>(() => {
    if (!searchResult) return null;
    const matches: SearchMatchWithRange[] = searchResult.matches.map((match) => {
      const node = parsedTree ? resolveMatchNode(parsedTree, match) : undefined;
      const range = node ? offsetToRange(lineStarts, node.offset, node.length) : null;
      return { ...match, range };
    });
    return { ...searchResult, matches };
  }, [searchResult, parsedTree, lineStarts]);

  // A stale highlight pointing at the wrong text is worse than no highlight, so clear it
  // whenever the document is edited or the search itself changes.
  useEffect(() => {
    matchDecorationsRef.current?.clear();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveMatch(null);
  }, [content, searchTerm, searchMode, searchMatchCase]);

  const searchSuggestions = useMemo(
    () => (parseResult?.value !== undefined ? collectSearchSuggestions(parseResult.value) : []),
    [parseResult]
  );

  useEffect(() => {
    const editorInstance = editorRef.current;
    const monaco = monacoRef.current;
    if (!editorInstance || !monaco) return;
    const model = editorInstance.getModel();
    if (!model) return;
    const markers: MonacoEditorNs.IMarkerData[] = (parseResult?.diagnostics ?? []).map((diagnostic) => ({
      severity: diagnostic.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
      message: diagnostic.message,
      startLineNumber: diagnostic.range.start.line,
      startColumn: diagnostic.range.start.column,
      endLineNumber: diagnostic.range.end.line,
      endColumn: diagnostic.range.end.column,
    }));
    monaco.editor.setModelMarkers(model, "json-tool", markers);
  }, [parseResult]);

  const handleMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;
  };

  const jumpToPosition = useCallback((position: Position) => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;
    const target: MonacoPosition = { lineNumber: position.line, column: position.column } as MonacoPosition;
    editorInstance.revealLineInCenter(position.line);
    editorInstance.setPosition(target);
    focusEditorPreservingPageScroll(editorInstance);
  }, []);

  const handleJumpToDiagnostic = useCallback(
    (diagnostic: JsonDiagnostic) => jumpToPosition(diagnostic.range.start),
    [jumpToPosition]
  );

  const handleJumpToMatch = useCallback((match: SearchMatchWithRange) => {
    const editorInstance = editorRef.current;
    const monaco = monacoRef.current;
    if (!editorInstance || !monaco || !match.range) return;

    const monacoRange = new monaco.Range(
      match.range.start.line,
      match.range.start.column,
      match.range.end.line,
      match.range.end.column
    );
    editorInstance.revealRangeInCenter(monacoRange);
    editorInstance.setPosition({ lineNumber: match.range.start.line, column: match.range.start.column });
    focusEditorPreservingPageScroll(editorInstance);

    if (!matchDecorationsRef.current) {
      matchDecorationsRef.current = editorInstance.createDecorationsCollection();
    }
    matchDecorationsRef.current.set([
      {
        range: monacoRange,
        options: {
          className: "json-search-highlight",
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      },
    ]);

    setActiveMatch(match);
  }, []);

  const activeMatchIndex = useMemo(() => {
    if (!activeMatch || !enrichedSearchResult) return -1;
    return enrichedSearchResult.matches.findIndex((match) => matchKey(match) === matchKey(activeMatch));
  }, [activeMatch, enrichedSearchResult]);

  const handleStepMatch = useCallback(
    (direction: 1 | -1) => {
      const matches = enrichedSearchResult?.matches ?? [];
      if (matches.length === 0) return;
      const nextIndex =
        activeMatchIndex === -1
          ? direction === 1 ? 0 : matches.length - 1
          : (activeMatchIndex + direction + matches.length) % matches.length;
      handleJumpToMatch(matches[nextIndex]);
    },
    [enrichedSearchResult, activeMatchIndex, handleJumpToMatch]
  );

  function handleSearchTermChange(next: string) {
    setSearchTerm(next);
    if (next.trim()) setResultsTab("search");
  }

  const canFormat = parseResult?.value !== undefined;
  const hasContent = content.trim().length > 0;

  const handleContentChange = (next: string) => {
    lastActionRef.current = "Edited JSON";
    setContent(next);
  };

  const handleFormat = () => {
    if (parseResult?.value === undefined) return;
    lastActionRef.current = "Formatted JSON";
    setContent(formatJson(parseResult.value, { indent: 2 }));
  };

  const handleMinify = () => {
    if (parseResult?.value === undefined) return;
    lastActionRef.current = "Minified JSON";
    setContent(minifyJson(parseResult.value));
  };

  const handleSortKeys = () => {
    if (parseResult?.value === undefined) return;
    lastActionRef.current = "Sorted JSON keys";
    setContent(formatJson(parseResult.value, { indent: 2, sortKeys: true }));
  };

  const handleFixIt = () => {
    setRepairResult(repairJson(content));
    setRepairOpen(true);
  };

  const handleAcceptRepair = () => {
    if (repairResult?.success && repairResult.repairedText) {
      lastActionRef.current = "Repaired JSON";
      setContent(repairResult.repairedText);
    }
    setRepairOpen(false);
  };

  const editorElement = (
    <div className="flex h-full flex-col">
      {activeMatch?.range ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted/40 px-3 py-1.5 text-xs">
          <span className="font-medium text-muted-foreground">
            Line {activeMatch.range.start.line}, Col {activeMatch.range.start.column}
          </span>
          <span className="font-mono text-muted-foreground">{activeMatch.path}</span>
          <span className="rounded bg-yellow-300/70 px-1.5 py-0.5 font-mono text-foreground dark:bg-yellow-500/40">
            {activeMatch.preview}
          </span>
        </div>
      ) : null}
      <div className="group relative min-h-0 flex-1">
        <CodeEditor value={content} onChange={handleContentChange} language="json" onMount={handleMount} />
        {!hasContent ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Paste or type your JSON here to format, validate, and explore it.
          </div>
        ) : null}
        {hasContent ? (
          <CopyIconButton
            value={content}
            label="JSON"
            className="absolute top-2 right-5 z-10 border bg-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          />
        ) : null}
      </div>
    </div>
  );

  const resultsElement = (
    <ResultsPanel
      parseResult={parseResult}
      rawText={content}
      activeTab={resultsTab}
      onActiveTabChange={setResultsTab}
      searchTerm={searchTerm}
      searchMode={searchMode}
      onSearchModeChange={setSearchMode}
      searchMatchCase={searchMatchCase}
      onSearchMatchCaseChange={setSearchMatchCase}
      searchResult={enrichedSearchResult}
      activeMatchKey={activeMatch ? matchKey(activeMatch) : null}
      onJumpToDiagnostic={handleJumpToDiagnostic}
      onJumpToMatch={handleJumpToMatch}
    />
  );

  return (
    <div className="flex flex-1 flex-col gap-2">
      {hasContent ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={!canFormat} onClick={handleFormat}>
              <Braces />
              Format
            </Button>
            <Button variant="outline" size="sm" disabled={!canFormat} onClick={handleMinify}>
              <Minimize2 />
              Minify
            </Button>
            <Button variant="outline" size="sm" disabled={!canFormat} onClick={handleSortKeys}>
              <SortAsc />
              Sort keys
            </Button>
            <Button variant="secondary" size="sm" onClick={handleFixIt}>
              <Wrench />
              Fix it
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <JsonSearchBox value={searchTerm} onChange={handleSearchTermChange} suggestions={searchSuggestions} />
            {searchTerm.trim() && enrichedSearchResult ? (
              <div className="flex items-center gap-1">
                <span className="px-1 text-xs text-muted-foreground tabular-nums">
                  {enrichedSearchResult.matches.length > 0
                    ? `${activeMatchIndex + 1}/${enrichedSearchResult.matches.length}`
                    : "0/0"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Previous match"
                  disabled={enrichedSearchResult.matches.length === 0}
                  onClick={() => handleStepMatch(-1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Next match"
                  disabled={enrichedSearchResult.matches.length === 0}
                  onClick={() => handleStepMatch(1)}
                >
                  <ChevronDown />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Fixed height, not min-height: Monaco/overflow-y-auto below only clip internally once their ancestor chain is a definite size, else long JSON grows the whole page instead of scrolling in place. */}
      <div className="h-[32rem]">
        {!hasContent ? (
          <div className="h-full rounded-lg border dark:bg-card">{editorElement}</div>
        ) : isDesktop ? (
          <ResizablePanelGroup orientation="horizontal" className="rounded-lg border dark:bg-card">
            <ResizablePanel defaultSize="60" minSize="30">
              {editorElement}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="40" minSize="25">
              <div className="h-full overflow-y-auto p-3">{resultsElement}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <Tabs defaultValue="editor" className="flex h-full flex-col">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1 rounded-lg border dark:bg-card">
              {editorElement}
            </TabsContent>
            <TabsContent value="results" className="flex-1 rounded-lg border dark:bg-card">
              {resultsElement}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <RepairDialog open={repairOpen} onOpenChange={setRepairOpen} repairResult={repairResult} onAccept={handleAcceptRepair} />
    </div>
  );
}
