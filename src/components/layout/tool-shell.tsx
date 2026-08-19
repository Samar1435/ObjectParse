import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { RelatedTools } from "@/components/layout/related-tools";
import { SidebarAdLayout } from "@/components/layout/sidebar-ad-layout";
import { AdSlot } from "@/components/ads/ad-slot";
import { AD_SLOTS } from "@/lib/ads-config";

export function ToolShell({
  currentSlug,
  title,
  description,
  seoContent,
  children,
}: {
  currentSlug: string;
  title: string;
  description?: string;
  seoContent?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SidebarAdLayout>
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{title}</span>
      </nav>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      <AdSlot variant="in-content" slot={AD_SLOTS.inContent} />
      {seoContent}
      <RelatedTools currentSlug={currentSlug} />
    </SidebarAdLayout>
  );
}
