"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Braces } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { FontSizeControl } from "@/components/layout/font-size-control";
import { ToolGroupNavItem } from "@/components/layout/tool-group-nav-item";
import { toolGroups, toolsRegistry } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const availableTools = toolsRegistry.filter((tool) => tool.status === "available");
  const renderedGroups = new Set<string>();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 shadow-sm shadow-black/[0.04] backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:shadow-black/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:h-14 sm:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 pr-2 font-semibold">
            <Braces className="size-5" />
            <span>Objectparse</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {availableTools.map((tool) => {
              if (tool.group) {
                if (renderedGroups.has(tool.group)) return null;
                renderedGroups.add(tool.group);
                const group = toolGroups.find((candidate) => candidate.key === tool.group);
                if (!group) return null;
                const groupTools = availableTools.filter((candidate) => candidate.group === tool.group);
                return <ToolGroupNavItem key={tool.group} group={group} tools={groupTools} pathname={pathname} />;
              }

              const href = `/${tool.slug}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={tool.slug}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {tool.title}
                </Link>
              );
            })}
            <Link
              href="/guides"
              aria-current={pathname.startsWith("/guides") ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith("/guides")
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Guides
            </Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FontSizeControl />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
