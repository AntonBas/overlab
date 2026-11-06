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
import { ChangesTable } from "../features/history/components/ChangesTable";
import { LineChart } from "../features/history/components/LineChart";
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
              position: "LEFT",
              recommendation: "RECOMMENDED",
              recommendationNote: null,
              iconUrl: null,
            },
          ]}
        />
        <RelatedHeroes
          heroes={[
            {
              slug: "mei",
              name: "Mei",
              role: "DAMAGE",
              note: null,
              portraitUrl: null,
            },
          ]}
        />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("history chart and changes table have no violations", async () => {
    const { container } = inRouter(
      <>
        <LineChart
          title="Win rate"
          tone="win"
          points={[
            { time: 0, value: 47 },
            { time: 1000, value: 49 },
          ]}
        />
        <ChangesTable
          showBan={false}
          changes={[
            {
              heroSlug: "ana",
              heroName: "Ana",
              role: "SUPPORT",
              winRateBefore: 47,
              winRateAfter: 49,
              winRateChange: 2,
              pickRateBefore: 10,
              pickRateAfter: 11,
              pickRateChange: 1,
              banRateBefore: null,
              banRateAfter: null,
              banRateChange: null,
            },
          ]}
        />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
