"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVT = "choirloop:ls";

/** Hydration-safe string localStorage hook. */
export function useLocalStorage(key: string, fallback: string): [string, (v: string) => void] {
  const value = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => {
      try {
        return localStorage.getItem(key) ?? fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
  const set = useCallback(
    (v: string) => {
      try {
        localStorage.setItem(key, v);
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(EVT));
    },
    [key],
  );
  return [value, set];
}
