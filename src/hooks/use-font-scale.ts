"use client";

import { useCallback, useEffect, useState } from "react";

export const SITE_SCALE_STORAGE_KEY = "site-scale";

const MIN_SCALE = 80;
const MAX_SCALE = 150;
const STEP = 10;
const DEFAULT_SCALE = 100;

// Matches Tailwind's `lg` breakpoint — large monitors get a bigger default; smaller
// viewports (laptops, tablets, phones) keep the original 100% baseline.
const LARGE_SCREEN_QUERY = "(min-width: 1024px)";
const LARGE_SCREEN_DEFAULT_SCALE = 120;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function applyScale(scale: number) {
  document.documentElement.style.fontSize = `${scale}%`;
}

function getViewportDefaultScale() {
  return window.matchMedia(LARGE_SCREEN_QUERY).matches ? LARGE_SCREEN_DEFAULT_SCALE : DEFAULT_SCALE;
}

export function useFontScale() {
  const [scale, setScale] = useState(DEFAULT_SCALE);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(SITE_SCALE_STORAGE_KEY));
    if (Number.isFinite(stored) && stored > 0) {
      const initial = clampScale(stored);
      setScale(initial);
      applyScale(initial);
      return;
    }

    const mql = window.matchMedia(LARGE_SCREEN_QUERY);
    const applyViewportDefault = () => {
      const initial = getViewportDefaultScale();
      setScale(initial);
      applyScale(initial);
    };
    applyViewportDefault();
    mql.addEventListener("change", applyViewportDefault);
    return () => mql.removeEventListener("change", applyViewportDefault);
  }, []);

  const setAndPersist = useCallback((next: number) => {
    const clamped = clampScale(next);
    setScale(clamped);
    applyScale(clamped);
    window.localStorage.setItem(SITE_SCALE_STORAGE_KEY, String(clamped));
  }, []);

  const increase = useCallback(() => setAndPersist(scale + STEP), [scale, setAndPersist]);
  const decrease = useCallback(() => setAndPersist(scale - STEP), [scale, setAndPersist]);
  const reset = useCallback(() => setAndPersist(getViewportDefaultScale()), [setAndPersist]);

  return {
    scale,
    increase,
    decrease,
    reset,
    canIncrease: scale < MAX_SCALE,
    canDecrease: scale > MIN_SCALE,
  };
}
