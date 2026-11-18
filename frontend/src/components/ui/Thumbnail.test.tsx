import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Thumbnail } from "./Thumbnail";

describe("Thumbnail", () => {
  it("is marked as loaded only once the image arrived", () => {
    const { container } = render(
      <Thumbnail url="/map.webp" width={48} height={27} />,
    );
    const image = container.querySelector("img")!;

    expect(image).not.toHaveAttribute("data-loaded");
    fireEvent.load(image);
    expect(image).toHaveAttribute("data-loaded");
  });

  it("shows the fallback when the image fails or is missing", () => {
    const { container, rerender } = render(
      <Thumbnail
        url="/map.webp"
        width={48}
        height={27}
        fallback={<span>no image</span>}
      />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(screen.getByText("no image")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();

    rerender(
      <Thumbnail
        url={null}
        width={48}
        height={27}
        fallback={<span>no image</span>}
      />,
    );
    expect(screen.getByText("no image")).toBeInTheDocument();
  });

  it("renders nothing without a fallback", () => {
    const { container } = render(
      <Thumbnail url={null} width={48} height={27} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
