"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFontScale } from "@/hooks/use-font-scale";

export function FontSizeControl() {
  const { scale, increase, decrease, reset, canIncrease, canDecrease } = useFontScale();

  return (
    <div className="flex items-center gap-0.5 rounded-md border p-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Decrease page size"
        disabled={!canDecrease}
        onClick={decrease}
      >
        <Minus className="size-3.5" />
      </Button>
      <button
        type="button"
        onClick={reset}
        aria-label="Reset page size to 100%"
        title="Reset page size"
        className="min-w-9 px-1 text-center text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:text-foreground"
      >
        {scale}%
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Increase page size"
        disabled={!canIncrease}
        onClick={increase}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
