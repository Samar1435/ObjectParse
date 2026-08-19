import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GuideDefinition } from "@/lib/guides-registry";

export function GuideCard({ guide }: { guide: GuideDefinition }) {
  return (
    <Link href={`/guides/${guide.slug}`} className="group">
      <Card className="h-full transition-colors hover:border-foreground/30 hover:bg-muted/40">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <CardTitle>{guide.navTitle}</CardTitle>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{guide.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
