import { useState } from "react";

export function useResettingPage(
  resetKey: unknown,
): [number, (page: number) => void] {
  const [state, setState] = useState({ page: 0, resetKey });
  const page = Object.is(state.resetKey, resetKey) ? state.page : 0;
  return [page, (next) => setState({ page: next, resetKey })];
}
