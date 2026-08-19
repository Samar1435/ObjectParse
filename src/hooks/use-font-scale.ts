"use client";

import { useCallback, useEffect, useState } from "react";

export const SITE_SCALE_STORAGE_KEY = "site-scale";

const MIN_SCALE = 80;
const MAX_SCALE = 150;
const STEP = 10;
const DEFAULT_SCALE = 100;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function applyScale(scale: number) {
  document.documentElement.style.fontSize = `${scale}%`;
}

export function useFontScale() {
  const [scale, setScale] = useState(DEFAULT_SCALE);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(SITE_SCALE_STORAGE_KEY));
    const initial = Number.isFinite(stored) && stored > 0 ? clampScale(stored) : DEFAULT_SCALE;
    setScale(initial);
    applyScale(initial);
  }, []);

  const setAndPersist = useCallback((next: number) => {
    const clamped = clampScale(next);
    setScale(clamped);
    applyScale(clamped);
    window.localStorage.setItem(SITE_SCALE_STORAGE_KEY, String(clamped));
  }, []);

  const increase = useCallback(() => setAndPersist(scale + STEP), [scale, setAndPersist]);
  const decrease = useCallback(() => setAndPersist(scale - STEP), [scale, setAndPersist]);
  const reset = useCallback(() => setAndPersist(DEFAULT_SCALE), [setAndPersist]);

  return {
    scale,
    increase,
    decrease,
    reset,
    canIncrease: scale < MAX_SCALE,
    canDecrease: scale > MIN_SCALE,
  };
}
