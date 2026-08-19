import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { SidebarAdLayout } from "@/components/layout/sidebar-ad-layout";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads-config";

export function GuideShell({
  title,
  description,
  relatedToolSlug,
  relatedToolTitle,
  children,
}: {
  title: string;
  description: string;
  relatedToolSlug: string;
  relatedToolTitle: string;
  children: ReactNode;
}) {
  return (
    <SidebarAdLayout>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/guides" className="hover:text-foreground">
          Guides
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{title}</span>
      </nav>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <AdSlot variant="leaderboard" slot={AD_SLOTS.leaderboard} />
      <article
        className="flex flex-col gap-6 text-sm leading-relaxed text-muted-foreground
          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground
          [&_strong]:font-medium [&_strong]:text-foreground
          [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground
          [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5
          [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5
          [&_a]:underline [&_a]:underline-offset-2"
      >
        {children}
      </article>
      <AdSlot variant="in-content" slot={AD_SLOTS.inContent} />
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm text-foreground">
          Ready to put this into practice?{" "}
          <Link href={`/${relatedToolSlug}`} className="font-medium underline underline-offset-2">
            Open the {relatedToolTitle} tool
          </Link>
          .
        </p>
      </div>
    </SidebarAdLayout>
  );
}
