import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const SEARCH_PARAMS: readonly string[] = ["q"];

export function useUrlParam(name: string): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(name) ?? "";
  const setValue = useCallback(
    (next: string) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next === "") {
            params.delete(name);
          } else {
            params.set(name, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [name, setSearchParams],
  );
  return [value, setValue];
}

export function useUrlFlag(name: string): [boolean, (value: boolean) => void] {
  const [value, setValue] = useUrlParam(name);
  const setFlag = useCallback(
    (next: boolean) => setValue(next ? "1" : ""),
    [setValue],
  );
  return [value === "1", setFlag];
}
