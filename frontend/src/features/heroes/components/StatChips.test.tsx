import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatChips } from "./StatChips";

describe("StatChips", () => {
  it("shows win, pick and ban rate in Competitive", () => {
    render(<StatChips winRate={51.8} pickRate={12.3} banRate={7.5} showBan />);

    expect(screen.getByText("51.8%")).toBeInTheDocument();
    expect(screen.getByText("12.3%")).toBeInTheDocument();
    expect(screen.getByText("7.5%")).toBeInTheDocument();
  });

  it("names every value for screen readers", () => {
    const { container } = render(
      <StatChips winRate={51.8} pickRate={12.3} banRate={7.5} showBan />,
    );

    const text = container.textContent;
    expect(text).toContain("Win rate");
    expect(text).toContain("Pick rate");
    expect(text).toContain("Ban rate");
  });

  it("has no ban rate in Quick Play", () => {
    render(
      <StatChips
        winRate={51.8}
        pickRate={12.3}
        banRate={7.5}
        showBan={false}
      />,
    );

    expect(screen.queryByText("7.5%")).toBeNull();
  });

  it("has no ban rate when there is none", () => {
    render(<StatChips winRate={51.8} pickRate={12.3} banRate={null} showBan />);

    expect(screen.getAllByText(/%$/)).toHaveLength(2);
  });
});
