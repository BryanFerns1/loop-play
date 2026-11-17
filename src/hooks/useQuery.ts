"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DATA_EVENT } from "@/services/api";

/** Minimal data hook: loads on mount / key change, refetches when any mutation fires. */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const reqId = useRef(0);

  const load = useCallback(async (silent = false) => {
    const id = ++reqId.current;
    if (!silent) setLoading(true);
    try {
      const out = await fetcherRef.current();
      if (id !== reqId.current) return;
      setData(out);
      setError(null);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [load, ...deps]);

  useEffect(() => {
    const h = () => void load(true);
    window.addEventListener(DATA_EVENT, h);
    return () => window.removeEventListener(DATA_EVENT, h);
  }, [load]);

  return { data, error, loading, reload: () => load() };
}
