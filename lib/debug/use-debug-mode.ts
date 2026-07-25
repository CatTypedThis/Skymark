"use client";

import { useEffect, useState } from "react";

/**
 * Read whether debug mode is enabled via the `?debug=1` URL flag. Off by
 * default so the normal experience and demo view stay clean. See Addendum 1
 * scope addition. Re-evaluates on URL changes (popstate).
 */
export function useDebugMode(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readFlag = () => {
      const params = new URLSearchParams(window.location.search);
      const value = params.get("debug");
      setEnabled(value === "1" || value === "true");
    };

    readFlag();
    window.addEventListener("popstate", readFlag);
    return () => window.removeEventListener("popstate", readFlag);
  }, []);

  return enabled;
}
