import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChangeView } from "./ChangeView";

describe("ChangeView", () => {
  it("shows the old and new value of an update", () => {
    render(
      <ChangeView
        action="UPDATE"
        changes={{ active: { from: true, to: false } }}
      />,
    );
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("true").tagName).toBe("DEL");
    expect(screen.getByText("false").tagName).toBe("INS");
  });

  it("lists the snapshot of a created entity", () => {
    render(<ChangeView action="CREATE" changes={{ name: "Ana" }} />);
    expect(screen.getByText('"Ana"')).toBeInTheDocument();
  });

  it("renders nothing without changes", () => {
    const { container } = render(<ChangeView action="LOGIN" changes={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
