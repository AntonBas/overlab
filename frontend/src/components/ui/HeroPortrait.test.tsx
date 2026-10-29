import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroPortrait } from "./HeroPortrait";

describe("HeroPortrait", () => {
  it("shows the image when there is a url", () => {
    const { container } = render(
      <HeroPortrait name="Ana" url="/media/heroes/ana.png" />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "/media/heroes/ana.png");
    expect(image).toHaveAttribute("alt", "");
  });

  it("falls back to the first letter without a url", () => {
    render(<HeroPortrait name="ana" url={null} />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("falls back to the first letter when the image fails to load", () => {
    const { container } = render(
      <HeroPortrait name="Ana" url="/media/heroes/missing.png" />,
    );

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
