import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ToolDefinition } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon;
  const isAvailable = tool.status === "available";

  const cardBody = (
    <Card
      className={cn(
        "h-full transition-colors",
        isAvailable ? "hover:border-foreground/30 hover:bg-muted/40" : "opacity-60"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
            <Icon className="size-5" />
          </div>
          <CardTitle>{tool.title}</CardTitle>
        </div>
        {isAvailable ? (
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        ) : (
          <Badge variant="secondary">Coming soon</Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </CardContent>
    </Card>
  );

  if (!isAvailable) {
    return <div aria-disabled="true">{cardBody}</div>;
  }

  return (
    <Link href={`/${tool.slug}`} className="group">
      {cardBody}
    </Link>
  );
}
