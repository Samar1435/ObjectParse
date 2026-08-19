"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isHmacAlgorithm, type JwtAlgorithm } from "@/lib/jwt";

export function KeyInput({
  alg,
  usage,
  value,
  onChange,
}: {
  alg: JwtAlgorithm;
  usage: "sign" | "verify";
  value: string;
  onChange: (value: string) => void;
}) {
  const isHmac = isHmacAlgorithm(alg);
  const label = isHmac ? "Secret" : usage === "sign" ? "Private key (PKCS#8 PEM)" : "Public key (SPKI PEM)";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {isHmac ? (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="your-256-bit-secret"
          className="font-mono"
        />
      ) : (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            usage === "sign"
              ? "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
              : "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
          }
          className="min-h-28 font-mono text-xs"
        />
      )}
    </div>
  );
}
