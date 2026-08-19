"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getExpiryStatus, type DecodedJwt } from "@/lib/jwt";

const EXPIRY_STYLES: Record<ReturnType<typeof getExpiryStatus>["state"], string> = {
  expired: "border-destructive/30 bg-destructive/10 text-destructive",
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "not-yet-valid": "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  none: "text-muted-foreground",
};

export function TokenStatusBadges({ decoded }: { decoded: DecodedJwt }) {
  const { header, payload } = decoded;
  const expiry = getExpiryStatus(payload);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {typeof header.alg === "string" ? (
        <Badge variant="outline" className="font-mono">
          {header.alg}
        </Badge>
      ) : null}
      {typeof header.typ === "string" ? <Badge variant="outline">{header.typ}</Badge> : null}
      {typeof header.kid === "string" ? (
        <Badge variant="outline" className="max-w-40 font-mono">
          <span className="truncate">kid: {header.kid}</span>
        </Badge>
      ) : null}
      <Badge variant="outline" className={cn(EXPIRY_STYLES[expiry.state])}>
        {expiry.label}
      </Badge>
    </div>
  );
}
