import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LineChart } from "./LineChart";

const points = [
  { time: Date.parse("2026-10-01T04:00:00Z"), value: 47.1 },
  { time: Date.parse("2026-10-08T04:00:00Z"), value: 49.3 },
];

const threePoints = [
  { time: Date.parse("2026-10-01T04:00:00Z"), value: 47.1 },
  { time: Date.parse("2026-10-02T04:00:00Z"), value: 48.0 },
  { time: Date.parse("2026-10-08T04:00:00Z"), value: 49.3 },
];

function mockPlotBox() {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 600,
    height: 180,
    right: 600,
    bottom: 180,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

function hoverAt(clientX: number) {
  const svg = screen.getByRole("img");
  fireEvent(
    svg,
    new MouseEvent("pointermove", { bubbles: true, clientX, clientY: 50 }),
  );
}

describe("LineChart", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(container.querySelectorAll(".chart__marker-dot")).toHaveLength(1);
    expect(container).not.toHaveTextContent("Patch inside");
  });

  it("shows no patch tooltip when the pointer is over a patch line", () => {
    mockPlotBox();
    const { container } = render(
      <LineChart
        title="Win rate"
        tone="win"
        points={threePoints}
        markers={[
          {
            time: Date.parse("2026-10-05T00:00:00Z"),
            label: "Hotfix Update",
          },
        ]}
      />,
    );

    hoverAt(342);

    expect(container.querySelector(".chart__tooltip")).toHaveTextContent(
      "48.0%",
    );
    expect(container.querySelector(".chart__tooltip")).not.toHaveTextContent(
      "Hotfix",
    );
  });

  it("keeps the tooltip of a point the same while the pointer stays near it", () => {
    mockPlotBox();
    const { container } = render(
      <LineChart
        title="Win rate"
        tone="win"
        points={threePoints}
        markers={[
          {
            time: Date.parse("2026-10-05T00:00:00Z"),
            label: "Hotfix Update",
          },
        ]}
      />,
    );

    hoverAt(450);
    const first = container.querySelector(".chart__tooltip")?.textContent;
    hoverAt(520);
    const second = container.querySelector(".chart__tooltip")?.textContent;

    expect(first).toBe(second);
  });

  it("mentions a patch released since the previous point in the point tooltip", () => {
    mockPlotBox();
    const { container } = render(
      <LineChart
        title="Win rate"
        tone="win"
        points={threePoints}
        markers={[
          {
            time: Date.parse("2026-10-05T00:00:00Z"),
            label: "Hotfix Update",
          },
        ]}
      />,
    );

    hoverAt(585);

    expect(container.querySelector(".chart__tooltip-patch")).toHaveTextContent(
      "Patch: Hotfix Update",
    );
    expect(container.querySelector(".chart__marker--active")).not.toBeNull();
  });

  it("renders nothing without points", () => {
    const { container } = render(
      <LineChart title="Win rate" tone="win" points={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the date and value of the point nearest to the pointer", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 600,
      height: 180,
      right: 600,
      bottom: 180,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const { container } = render(
      <LineChart title="Win rate" tone="win" points={threePoints} />,
    );
    expect(container.querySelector(".chart__tooltip")).toBeNull();

    hoverAt(585);

    const tooltip = container.querySelector(".chart__tooltip");
    expect(tooltip).toHaveTextContent("8 Oct 2026");
    expect(tooltip).toHaveTextContent("49.3%");
    expect(container.querySelector(".chart__dot--active")).not.toBeNull();
    expect(container.querySelector(".chart__guide")).not.toBeNull();
  });

  it("names the season of the hovered date", () => {
    mockPlotBox();
    const seasonAt = (time: number) =>
      time >= Date.parse("2026-10-05T00:00:00Z") ? 5 : null;
    const { container } = render(
      <LineChart
        title="Win rate"
        tone="win"
        points={threePoints}
        seasonAt={seasonAt}
      />,
    );

    hoverAt(585);
    expect(container.querySelector(".chart__tooltip")).toHaveTextContent(
      "Season 5",
    );
    expect(screen.getByRole("status")).toHaveTextContent("season 5");

    hoverAt(45);
    expect(container.querySelector(".chart__tooltip-season")).toBeNull();
  });

  it("names the patch in effect when no patch was released since the previous point", () => {
    mockPlotBox();
    const markers = [
      {
        time: Date.parse("2026-09-20T00:00:00Z"),
        label: "Season 5",
        kind: "patch" as const,
      },
      {
        time: Date.parse("2026-09-28T00:00:00Z"),
        label: "Hotfix Update",
        kind: "hotfix" as const,
      },
    ];
    const { container } = render(
      <LineChart
        title="Win rate"
        tone="win"
        points={threePoints}
        markers={markers}
      />,
    );

    hoverAt(585);

    expect(container.querySelector(".chart__tooltip-effect")).toHaveTextContent(
      "In effect: Hotfix Update · 28 Sept",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "in effect: Hotfix Update",
    );
  });

  it("leaves out the patch in effect when a patch was released since the previous point", () => {
    mockPlotBox();
    const markers = [
      {
        time: Date.parse("2026-10-05T00:00:00Z"),
        label: "Season 6",
        kind: "patch" as const,
      },
    ];
    const { container } = render(
      <LineChart
        title="Win rate"
        tone="win"
        points={threePoints}
        markers={markers}
      />,
    );

    hoverAt(585);

    expect(container.querySelector(".chart__tooltip-effect")).toBeNull();
    expect(container.querySelector(".chart__tooltip-patch")).toHaveTextContent(
      "Season 6",
    );
  });

  it("shows the change since the previous point", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 600,
      height: 180,
      right: 600,
      bottom: 180,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const { container } = render(
      <LineChart title="Win rate" tone="win" points={threePoints} />,
    );

    hoverAt(585);

    expect(container.querySelector(".chart__tooltip")).toHaveTextContent(
      "+1.3",
    );
  });

  it("says there is no change when the value did not move", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 600,
      height: 180,
      right: 600,
      bottom: 180,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const { container } = render(
      <LineChart
        title="Win rate"
        tone="win"
        points={[
          { time: Date.parse("2026-10-28T04:00:00Z"), value: 47.4 },
          { time: Date.parse("2026-10-29T04:00:00Z"), value: 47.4 },
        ]}
      />,
    );

    hoverAt(585);

    expect(container.querySelector(".chart__tooltip")).toHaveTextContent(
      "No change",
    );
    expect(container.querySelector(".chart__tooltip")).not.toHaveTextContent(
      "0.0",
    );
  });

  it("hides the tooltip when the pointer leaves", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 600,
      height: 180,
      right: 600,
      bottom: 180,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const { container } = render(
      <LineChart title="Win rate" tone="win" points={threePoints} />,
    );
    hoverAt(45);
    expect(container.querySelector(".chart__tooltip")).not.toBeNull();

    fireEvent(
      screen.getByRole("img"),
      new MouseEvent("pointerout", { bubbles: true, relatedTarget: null }),
    );

    expect(container.querySelector(".chart__tooltip")).toBeNull();
  });

  it("can be explored with the arrow keys and announces the value", async () => {
    const user = userEvent.setup();
    render(<LineChart title="Win rate" tone="win" points={threePoints} />);

    screen.getByRole("img").focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("status")).toHaveTextContent("1 Oct 2026: 47.1%");

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("8 Oct 2026: 49.3%");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
