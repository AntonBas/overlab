import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Guide } from "../../../types/guide";
import { SpotsSection } from "./SpotsSection";

function guide(overrides: Partial<Guide>): Guide {
  return {
    id: 1,
    slug: "spot",
    path: "1-spot",
    heroSlug: "illari",
    heroName: "Illari",
    mapSlug: "busan",
    mapName: "Busan",
    title: "Pylon spot",
    youtubeId: "dQw4w9WgXcQ",
    startSeconds: 0,
    endSeconds: null,
    kind: "SETUP",
    side: "BOTH",
    abilitySlug: null,
    embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=0",
    description: null,
    sortOrder: 0,
    published: true,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const guides = [
  guide({ id: 1, title: "Illari pylon" }),
  guide({
    id: 2,
    heroSlug: "ashe",
    heroName: "Ashe",
    kind: "ULTIMATE",
    title: "Ashe bob",
  }),
];

function renderSection(groupBy: "hero" | "map" | "none") {
  return render(
    <MemoryRouter>
      <SpotsSection
        title="Spots & setups"
        guides={guides}
        groupBy={groupBy}
        emptyMessage="Nothing yet"
      />
    </MemoryRouter>,
  );
}

describe("SpotsSection", () => {
  it("narrows the list to a hero chosen in the select", async () => {
    renderSection("hero");

    expect(screen.getByText("Illari pylon")).toBeInTheDocument();
    expect(screen.getByText("Ashe bob")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("combobox", { name: "Hero" }));
    await userEvent.click(screen.getByRole("option", { name: /^Ashe/ }));

    expect(screen.getByText("Ashe bob")).toBeInTheDocument();
    expect(screen.queryByText("Illari pylon")).not.toBeInTheDocument();
  });

  it("filters by the type select", async () => {
    renderSection("hero");

    await userEvent.click(screen.getByRole("combobox", { name: "Type" }));
    await userEvent.click(
      screen.getByRole("option", { name: /^Ultimate spot/ }),
    );

    expect(screen.getByText("Ashe bob")).toBeInTheDocument();
    expect(screen.queryByText("Illari pylon")).not.toBeInTheDocument();
  });

  it("starts a video only after pressing play", async () => {
    const { container } = renderSection("none");
    expect(container.querySelector("iframe")).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Play Illari pylon" }),
    );

    expect(container.querySelector("iframe")).not.toBeNull();
  });

  it("says when there is nothing", () => {
    render(
      <MemoryRouter>
        <SpotsSection
          title="Spots & setups"
          guides={[]}
          groupBy="hero"
          emptyMessage="Nothing yet"
        />
      </MemoryRouter>,
    );

    expect(
      within(screen.getByRole("region")).getByText("Nothing yet"),
    ).toBeInTheDocument();
  });

  it("offers to reset filters when nothing matches", async () => {
    renderSection("hero");

    await userEvent.click(screen.getByRole("combobox", { name: "Hero" }));
    await userEvent.click(screen.getByRole("option", { name: /^Ashe/ }));
    await userEvent.click(screen.getByRole("combobox", { name: "Type" }));
    await userEvent.click(screen.getByRole("option", { name: /^Setup/ }));

    expect(screen.getByText(/No spots match/)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Reset filters" }),
    );

    expect(screen.getByText("Illari pylon")).toBeInTheDocument();
    expect(screen.getByText("Ashe bob")).toBeInTheDocument();
  });

  it("puts every spot in one scrollable row", () => {
    const many = Array.from({ length: 8 }, (_, index) =>
      guide({ id: index + 1, title: `Spot ${index + 1}` }),
    );
    render(
      <MemoryRouter>
        <SpotsSection
          title="Spots & setups"
          guides={many}
          groupBy="none"
          emptyMessage="Nothing yet"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Spot 1")).toBeInTheDocument();
    expect(screen.getByText("Spot 8")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Show all/ }),
    ).not.toBeInTheDocument();
  });

  it("lists every guide in a grid without a heading when expanded", () => {
    render(
      <MemoryRouter>
        <SpotsSection
          title="Illari guides"
          guides={guides}
          groupBy="hero"
          expanded
          emptyMessage="Nothing yet"
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("links to the full list only when there are more guides than shown", () => {
    const many = Array.from({ length: 7 }, (_, index) =>
      guide({ id: index + 10, title: `Spot ${index}` }),
    );
    const { rerender } = render(
      <MemoryRouter>
        <SpotsSection
          title="Spots"
          guides={many}
          groupBy="map"
          moreHref="/heroes/illari/guides"
          emptyMessage="Nothing yet"
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "All guides" })).toHaveAttribute(
      "href",
      "/heroes/illari/guides",
    );

    rerender(
      <MemoryRouter>
        <SpotsSection
          title="Spots"
          guides={many.slice(0, 3)}
          groupBy="map"
          moreHref="/heroes/illari/guides"
          emptyMessage="Nothing yet"
        />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("link", { name: "All guides" }),
    ).not.toBeInTheDocument();
  });
});
