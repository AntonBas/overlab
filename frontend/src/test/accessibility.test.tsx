import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { heroStat } from "./fixtures";

vi.mock("../features/auth/context/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock("../features/heroes/api/heroesApi", () => ({
  fetchHeroes: vi.fn(() => Promise.resolve([])),
}));

import { Header } from "../components/layout/Header";
import { RoleBadge } from "../components/ui/RoleBadge";
import { PerkList } from "../features/heroes/components/PerkList";
import { RelatedHeroes } from "../features/heroes/components/RelatedHeroes";
import { StatsTable } from "../features/stats/components/StatsTable";

function inRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("accessibility", () => {
  it("header has no violations", async () => {
    const { container } = inRouter(<Header />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("statistics table has no violations", async () => {
    const { container } = inRouter(
      <StatsTable
        heroes={[
          heroStat(),
          heroStat({ heroSlug: "mei", heroName: "Mei", role: "DAMAGE" }),
        ]}
        showBan
        showDelta
        sort="WIN_RATE"
        direction="DESC"
        onSort={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("role badges, perks and related heroes have no violations", async () => {
    const { container } = inRouter(
      <>
        <RoleBadge role="TANK" />
        <PerkList
          perks={[
            {
              id: 1,
              heroSlug: "ana",
              name: "Perk",
              description: "Text",
              slot: "MAJOR",
              recommendation: "RECOMMENDED",
              recommendationNote: null,
            },
          ]}
        />
        <RelatedHeroes
          heroes={[
            {
              slug: "mei",
              name: "Mei",
              role: "DAMAGE",
              strength: 2,
              note: null,
            },
          ]}
        />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
