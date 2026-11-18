import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";
import { ListSkeleton } from "./ListSkeleton";

describe("ListSkeleton", () => {
  it("announces what is loading and hides the placeholders from assistive tech", () => {
    render(<ListSkeleton kind="hero-tiles" label="Loading heroes" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading heroes...");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("renders a card per map placeholder", () => {
    const { container } = render(
      <ListSkeleton kind="map-cards" label="Loading maps" />,
    );

    expect(container.querySelectorAll(".list-skeleton__map")).toHaveLength(6);
  });

  it("renders detail and card list placeholders", () => {
    const detail = render(<ListSkeleton kind="detail" label="Loading hero" />);
    expect(
      detail.container.querySelectorAll(".list-skeleton__card"),
    ).toHaveLength(4);
    detail.unmount();

    const cards = render(<ListSkeleton kind="cards" label="Loading guides" />);
    expect(
      cards.container.querySelectorAll(".list-skeleton__row"),
    ).toHaveLength(6);
  });
});

describe("EmptyState", () => {
  it("shows its message next to the icon", () => {
    render(<EmptyState>No heroes match.</EmptyState>);

    expect(screen.getByText("No heroes match.")).toBeInTheDocument();
  });
});
