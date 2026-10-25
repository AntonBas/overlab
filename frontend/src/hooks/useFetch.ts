import { useCallback, useEffect, useRef, useState } from "react";
import { toFailure, type RequestFailure } from "../services/api";

export interface FetchState<T> {
  data: T | null;
  error: RequestFailure | null;
  loading: boolean;
  reload: () => void;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: RequestFailure | null;
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  dependencies: readonly unknown[],
): FetchState<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const fetcherRef = useRef(fetcher);
  const key = `${JSON.stringify(dependencies)}#${version}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) {
          setSettled({ key, data, error: null });
        }
      })
      .catch((failure: unknown) => {
        if (!cancelled) {
          setSettled({ key, data: null, error: toFailure(failure) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const current = settled?.key === key ? settled : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: current === null,
    reload,
  };
}
