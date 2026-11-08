import { describe, expect, it } from "vitest";
import { sortHeroesByRoleThenName } from "./sortHeroes";

describe("sortHeroesByRoleThenName", () => {
  it("orders tank, damage, support and then by name", () => {
    const sorted = sortHeroesByRoleThenName([
      { name: "Mercy", role: "SUPPORT" as const },
      { name: "Reaper", role: "DAMAGE" as const },
      { name: "Winston", role: "TANK" as const },
      { name: "Ana", role: "SUPPORT" as const },
      { name: "Ashe", role: "DAMAGE" as const },
      { name: "D.Va", role: "TANK" as const },
    ]);

    expect(sorted.map((hero) => hero.name)).toEqual([
      "D.Va",
      "Winston",
      "Ashe",
      "Reaper",
      "Ana",
      "Mercy",
    ]);
  });

  it("does not change the original list", () => {
    const heroes = [
      { name: "Mercy", role: "SUPPORT" as const },
      { name: "Winston", role: "TANK" as const },
    ];

    sortHeroesByRoleThenName(heroes);

    expect(heroes[0]?.name).toBe("Mercy");
  });
});
