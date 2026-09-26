"use client";

import { useEffect, useState } from "react";

/** CSS-first layouts preferred; use only when structure must fork (e.g. Trade split). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Primary layout split — Tailwind `md` = 768px */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
