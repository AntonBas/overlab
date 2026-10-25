import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LineChart } from "./LineChart";

const points = [
  { time: Date.parse("2026-10-01T04:00:00Z"), value: 47.1 },
  { time: Date.parse("2026-10-08T04:00:00Z"), value: 49.3 },
];

describe("LineChart", () => {
  it("describes the trend for screen readers", () => {
    render(<LineChart title="Win rate" tone="win" points={points} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Win rate: from 47.1% on 1 Oct to 49.3% on 8 Oct",
    );
  });

  it("offers the same data as a table", async () => {
    const user = userEvent.setup();
    render(<LineChart title="Win rate" tone="win" points={points} />);

    await user.click(screen.getByRole("button", { name: "Show table" }));

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "49.3%" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Show chart" }),
    ).toBeInTheDocument();
  });

  it("marks only the patches inside the plotted range", () => {
    const { container } = render(
      <LineChart
        title="Win rate"
        tone="win"
        points={points}
        markers={[
          { time: Date.parse("2026-10-05T00:00:00Z"), label: "Patch inside" },
          { time: Date.parse("2026-09-01T00:00:00Z"), label: "Patch outside" },
        ]}
      />,
    );
    expect(container.querySelectorAll(".chart__marker")).toHaveLength(1);
  });

  it("renders nothing without points", () => {
    const { container } = render(
      <LineChart title="Win rate" tone="win" points={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
