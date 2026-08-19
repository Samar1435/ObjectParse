"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EC_ALGORITHMS, HMAC_ALGORITHMS, RSA_ALGORITHMS, type JwtAlgorithm } from "@/lib/jwt";

export function AlgorithmSelect({
  value,
  onChange,
}: {
  value: JwtAlgorithm;
  onChange: (alg: JwtAlgorithm) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as JwtAlgorithm)}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>HMAC (secret)</SelectLabel>
          {HMAC_ALGORITHMS.map((alg) => (
            <SelectItem key={alg} value={alg}>
              {alg}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>RSA (key pair)</SelectLabel>
          {RSA_ALGORITHMS.map((alg) => (
            <SelectItem key={alg} value={alg}>
              {alg}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>ECDSA (key pair)</SelectLabel>
          {EC_ALGORITHMS.map((alg) => (
            <SelectItem key={alg} value={alg}>
              {alg}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
