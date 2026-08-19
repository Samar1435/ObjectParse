import { JsonTool } from "@/components/tools/json/json-tool";
import { formatJson } from "@/lib/json";

function formatIfValidJson(content: string): string {
  try {
    return formatJson(JSON.parse(content), { indent: 2 });
  } catch {
    return content;
  }
}

export function InlineJsonPanel({ content }: { content: string }) {
  const formatted = formatIfValidJson(content);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase">JSON</span>
      <JsonTool key={content} initialContent={formatted} />
    </div>
  );
}
