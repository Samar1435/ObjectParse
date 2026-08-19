import { toolsRegistry } from "@/lib/tools-registry";
import { ToolCard } from "@/components/home/tool-card";

export function ToolGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {toolsRegistry
        .filter((tool) => tool.status !== "hidden")
        .map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
    </div>
  );
}
