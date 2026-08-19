"use client";

import { useEffect, useRef, useState } from "react";
import { createLiveValidator, type LiveValidator, type ParseResult } from "@/lib/json";

export function useJsonEngine(content: string): ParseResult | null {
  const [result, setResult] = useState<ParseResult | null>(null);
  const validatorRef = useRef<LiveValidator | null>(null);
  if (validatorRef.current == null) {
    validatorRef.current = createLiveValidator();
  }

  useEffect(() => {
    const validator = validatorRef.current;
    if (!validator) return;
    const unsubscribe = validator.subscribe(setResult);
    return () => {
      unsubscribe();
      validator.dispose();
    };
  }, []);

  useEffect(() => {
    validatorRef.current?.onChange(content);
  }, [content]);

  return result;
}
