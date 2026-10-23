"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ToolDefinition, ToolGroupDefinition } from "@/lib/tools-registry";
import { cn } from "@/lib/utils";

/** A clickable nav item that opens a dropdown listing every tool in `group` — used to fold a
 * family of related tools (e.g. all the Base64 converters) under one top-level nav slot. */
export function ToolGroupNavItem({
  group,
  tools,
  pathname,
}: {
  group: ToolGroupDefinition;
  tools: ToolDefinition[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);

  const isActive = tools.some((tool) => pathname === `/${tool.slug}`);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          {group.label}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isToolActive = pathname === `/${tool.slug}`;
          return (
            <DropdownMenuItem key={tool.slug} asChild>
              <Link
                href={`/${tool.slug}`}
                aria-current={isToolActive ? "page" : undefined}
                className={cn("flex items-start gap-2.5 py-2", isToolActive && "bg-accent")}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{tool.title}</span>
                  <span className="text-xs text-muted-foreground">{tool.description}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
