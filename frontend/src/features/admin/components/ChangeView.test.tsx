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
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("yes").tagName).toBe("DEL");
    expect(screen.getByText("no").tagName).toBe("INS");
  });

  it("lists the snapshot of a created entity", () => {
    render(<ChangeView action="CREATE" changes={{ name: "Ana" }} />);
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("shows enum values as readable text", () => {
    render(
      <ChangeView
        action="UPDATE"
        changes={{ recommendation: { from: "OPTIONAL", to: "RECOMMENDED" } }}
      />,
    );
    expect(screen.getByText("Optional").tagName).toBe("DEL");
    expect(screen.getByText("Recommended").tagName).toBe("INS");
  });

  it("renders nothing without changes", () => {
    const { container } = render(<ChangeView action="LOGIN" changes={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
