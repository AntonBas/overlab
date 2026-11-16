import { useCallback, useEffect, useRef, useState } from "react";
import { toFailure, type RequestFailure } from "../services/api";

export interface FetchState<T> {
  data: T | null;
  error: RequestFailure | null;
  loading: boolean;
  stale: boolean;
  reload: () => void;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: RequestFailure | null;
}

interface FetchOptions {
  keepPrevious?: boolean;
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  dependencies: readonly unknown[],
  options: FetchOptions = {},
): FetchState<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const fetcherRef = useRef(fetcher);
  const key = `${JSON.stringify(dependencies)}#${version}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    const abort = new AbortController();
    fetcherRef
      .current(abort.signal)
      .then((data) => {
        if (!abort.signal.aborted) {
          setSettled({ key, data, error: null });
        }
      })
      .catch((failure: unknown) => {
        if (!abort.signal.aborted) {
          setSettled({ key, data: null, error: toFailure(failure) });
        }
      });
    return () => abort.abort();
  }, [key]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const current = settled?.key === key ? settled : null;
  const shown = current ?? (options.keepPrevious ? settled : null);

  return {
    data: shown?.data ?? null,
    error: shown?.error ?? null,
    loading: shown === null,
    stale: shown !== null && current === null,
    reload,
  };
}
