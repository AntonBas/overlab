import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSegmentedIndicator } from "./useSegmentedIndicator";

function Toggle({ wrap }: { wrap: boolean }) {
  useSegmentedIndicator();
  return (
    <div
      className="segmented"
      data-testid="toggle"
      style={{ display: "flex", flexWrap: wrap ? "wrap" : "nowrap" }}
    >
      <button type="button" className="segmented__item">
        Quick Play
      </button>
      <button type="button" className="segmented__item segmented__item--active">
        Competitive
      </button>
    </div>
  );
}

describe("useSegmentedIndicator", () => {
  it("adds a sliding indicator to a single-row segmented control", async () => {
    const { getByTestId } = render(<Toggle wrap={false} />);

    await waitFor(() =>
      expect(getByTestId("toggle")).toHaveClass("segmented--slide"),
    );
    expect(getByTestId("toggle").style.getPropertyValue("--seg-x")).toBe("0px");
  });

  it("leaves a wrapped control alone", async () => {
    const { getByTestId } = render(<Toggle wrap />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(getByTestId("toggle")).not.toHaveClass("segmented--slide");
  });
});
