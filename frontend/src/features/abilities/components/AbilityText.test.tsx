import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Ability } from "../../../types/hero";
import { AbilitiesContext, abilityKey } from "../context/abilitiesContext";
import { AbilityText } from "./AbilityText";

const defenseMatrix: Ability = {
  heroSlug: "dva",
  heroName: "D.Va",
  heroPortraitUrl: null,
  slug: "defense-matrix",
  name: "Defense Matrix",
  description: "Shoot incoming projectiles out of the air.",
  iconUrl: null,
  control: "ABILITY_2",
};

function renderText(text: string) {
  return render(
    <AbilitiesContext.Provider
      value={new Map([[abilityKey("dva", "defense-matrix"), defenseMatrix]])}
    >
      <MemoryRouter>
        <AbilityText text={text} />
      </MemoryRouter>
    </AbilitiesContext.Provider>,
  );
}

describe("AbilityText", () => {
  it("renders plain text untouched", () => {
    renderText("Just a sentence.");

    expect(screen.getByText("Just a sentence.")).toBeInTheDocument();
  });

  it("replaces a known token with a chip that describes the ability", () => {
    renderText("Eats projectiles with [[dva/defense-matrix]] every time.");

    const [chip] = screen.getAllByText("Defense Matrix");
    expect(chip).toHaveAttribute("tabindex", "0");
    expect(chip).toHaveAccessibleDescription(/Shoot incoming projectiles/);
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Shoot incoming projectiles out of the air.",
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("E");
    expect(screen.getByRole("link", { name: "D.Va" })).toHaveAttribute(
      "href",
      "/heroes/dva",
    );
    expect(screen.getByText(/every time\./)).toBeInTheDocument();
  });

  it("falls back to a readable name for an unknown token", () => {
    renderText("Uses [[zarya/particle-barrier]] first.");

    expect(screen.getByText("Particle Barrier")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
