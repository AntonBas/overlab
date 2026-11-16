import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useUrlFlag, useUrlParam } from "./useUrlParam";

function wrapperFor(route: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
  };
}

describe("useUrlParam", () => {
  it("reads the value from the address", () => {
    const { result } = renderHook(() => useUrlParam("q"), {
      wrapper: wrapperFor("/maps?q=ria"),
    });

    expect(result.current[0]).toBe("ria");
  });

  it("writes the value without touching other parameters and removes it when empty", () => {
    const { result } = renderHook(
      () => ({ param: useUrlParam("q"), location: useLocation() }),
      { wrapper: wrapperFor("/maps?mode=ESCORT") },
    );

    act(() => result.current.param[1]("ria"));
    expect(result.current.location.search).toBe("?mode=ESCORT&q=ria");

    act(() => result.current.param[1](""));
    expect(result.current.location.search).toBe("?mode=ESCORT");
  });
});

describe("useUrlFlag", () => {
  it("is on only for the value 1 and writes a flag back", () => {
    const { result } = renderHook(
      () => ({ flag: useUrlFlag("favorites"), location: useLocation() }),
      { wrapper: wrapperFor("/maps?favorites=yes") },
    );
    expect(result.current.flag[0]).toBe(false);

    act(() => result.current.flag[1](true));
    expect(result.current.location.search).toBe("?favorites=1");
    expect(result.current.flag[0]).toBe(true);

    act(() => result.current.flag[1](false));
    expect(result.current.location.search).toBe("");
  });
});
