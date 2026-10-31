import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ControlSchemeContext,
  type ControlScheme,
} from "../context/controlSchemeContext";
import { AbilityKey } from "./AbilityKey";

function renderKey(scheme: ControlScheme, control: "ULTIMATE" | "PASSIVE") {
  return render(
    <ControlSchemeContext.Provider value={{ scheme, setScheme: () => {} }}>
      <AbilityKey control={control} showLabel />
    </ControlSchemeContext.Provider>,
  );
}

describe("AbilityKey", () => {
  it("shows the PC key", () => {
    renderKey("PC", "ULTIMATE");

    expect(screen.getByText("Q")).toBeInTheDocument();
    expect(screen.getByText("Ultimate")).toBeInTheDocument();
  });

  it("shows console buttons on Xbox and PlayStation", () => {
    const { unmount } = renderKey("XBOX", "ULTIMATE");
    expect(screen.getByText("LB + RB")).toBeInTheDocument();
    unmount();

    renderKey("PLAYSTATION", "ULTIMATE");
    expect(screen.getByText("L1 + R1")).toBeInTheDocument();
  });

  it("shows Nintendo Switch buttons", () => {
    renderKey("SWITCH", "ULTIMATE");

    expect(screen.getByText("L + R")).toBeInTheDocument();
  });

  it("labels a passive without a key", () => {
    renderKey("XBOX", "PASSIVE");

    expect(screen.getByText("Passive")).toBeInTheDocument();
    expect(document.querySelector("kbd")).toBeNull();
  });
});
