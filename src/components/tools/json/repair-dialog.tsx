"use client";

import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RepairResult } from "@/lib/json";

export function RepairDialog({
  open,
  onOpenChange,
  repairResult,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairResult: RepairResult | null;
  onAccept: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{repairResult?.success ? "Here's what we'll fix" : "Couldn't auto-repair this JSON"}</DialogTitle>
          <DialogDescription>
            {repairResult?.success
              ? "Review the changes below, then accept to replace the editor contents."
              : repairResult?.error ?? "This input has an error we couldn't automatically resolve."}
          </DialogDescription>
        </DialogHeader>

        {repairResult?.success && repairResult.changes.length > 0 ? (
          <ul className="flex max-h-64 flex-col gap-1.5 overflow-y-auto text-sm">
            {repairResult.changes.map((change, index) => (
              <li key={index} className="rounded-md bg-muted/50 px-2.5 py-1.5">
                {change.description}
              </li>
            ))}
          </ul>
        ) : null}

        <DialogFooter>
          {repairResult?.success ? (
            <Button onClick={onAccept}>
              <Wrench />
              Accept fix
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
