"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onForeground` when the page becomes visible again: switching back to the
 * tab, or reopening the installed app on iOS (which resumes from memory or the
 * back-forward cache without reloading).
 */
export function useOnForeground(onForeground: () => void) {
  const cb = useRef(onForeground);
  cb.current = onForeground;

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") cb.current();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) cb.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
}
