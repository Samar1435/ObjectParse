"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether a media query currently matches. Starts `false` (matching what a
 * server render produces) and corrects itself after mount, so callers that use this
 * to pick between two mutually-exclusive layouts never mount both at once — unlike a
 * pure-CSS `hidden md:block` / `md:hidden` pair, which puts both subtrees in the DOM
 * and leaves any imperative ref (e.g. a Monaco editor instance) pointing at whichever
 * one mounted last, visible or not.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const onChange = () => setMatches(mediaQueryList.matches);
    onChange();
    mediaQueryList.addEventListener("change", onChange);
    return () => mediaQueryList.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
