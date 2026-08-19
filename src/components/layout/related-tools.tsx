import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toolsRegistry } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

export function RelatedTools({ currentSlug }: { currentSlug: string }) {
  const others = toolsRegistry.filter((tool) => tool.slug !== currentSlug && tool.status !== "hidden");
  if (others.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <span className="text-xs font-medium text-muted-foreground uppercase">Other tools</span>
      <div className="flex flex-wrap gap-2">
        {others.map((tool) => {
          const Icon = tool.icon;
          const isAvailable = tool.status === "available";
          const itemClasses = cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            isAvailable ? "hover:bg-muted" : "cursor-default text-muted-foreground opacity-60"
          );

          if (!isAvailable) {
            return (
              <span key={tool.slug} className={itemClasses}>
                <Icon className="size-4" />
                {tool.title}
                <Badge variant="secondary">Coming soon</Badge>
              </span>
            );
          }

          return (
            <Link key={tool.slug} href={`/${tool.slug}`} className={itemClasses}>
              <Icon className="size-4" />
              {tool.title}
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
