"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DECODE_METHODS, type DecodeMethod } from "@/lib/auth-inspector";

export function DecodeSelect({
  value,
  onChange,
}: {
  value: DecodeMethod;
  onChange: (method: DecodeMethod) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as DecodeMethod)}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DECODE_METHODS.map((method) => (
          <SelectItem key={method.value} value={method.value}>
            {method.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
