import { useCallback, useEffect, useRef, useState } from "react";
import { remainingSpinnerTime } from "../components/ui/spinnerTiming";
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
  enabled?: boolean;
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  dependencies: readonly unknown[],
  options: FetchOptions = {},
): FetchState<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const fetcherRef = useRef(fetcher);
  const hasSettledRef = useRef(false);
  const key = `${JSON.stringify(dependencies)}#${version}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const abort = new AbortController();
    const startedAt = Date.now();
    let holdTimer: number | undefined;
    const settle = (result: Settled<T>) => {
      if (abort.signal.aborted) {
        return;
      }
      const showsSpinner = !options.keepPrevious || !hasSettledRef.current;
      const wait = showsSpinner
        ? remainingSpinnerTime(Date.now() - startedAt)
        : 0;
      const apply = () => {
        hasSettledRef.current = true;
        setSettled(result);
      };
      if (wait === 0) {
        apply();
      } else {
        holdTimer = window.setTimeout(apply, wait);
      }
    };
    fetcherRef
      .current(abort.signal)
      .then((data) => settle({ key, data, error: null }))
      .catch((failure: unknown) =>
        settle({ key, data: null, error: toFailure(failure) }),
      );
    return () => {
      abort.abort();
      window.clearTimeout(holdTimer);
    };
  }, [key, options.keepPrevious, enabled]);

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
