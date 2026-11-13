import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImageUploadField } from "./ImageUploadField";

function renderField(imageUrl: string | null = null) {
  const onUpload = vi.fn().mockResolvedValue(undefined);
  const onRemove = vi.fn().mockResolvedValue(undefined);
  render(
    <ImageUploadField
      label="Image"
      imageUrl={imageUrl}
      onUpload={onUpload}
      onRemove={onRemove}
    />,
  );
  return { onUpload, onRemove };
}

describe("ImageUploadField", () => {
  it("uploads a chosen image", async () => {
    const { onUpload } = renderField();
    const file = new File(["x"], "map.png", { type: "image/png" });

    await userEvent.upload(screen.getByLabelText("Image file"), file);

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
  });

  it("rejects other file types without calling the server", async () => {
    const { onUpload } = renderField();
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(
      screen.getByLabelText("Image file"),
      new File(["<svg/>"], "map.svg", { type: "image/svg+xml" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only PNG, JPEG and WebP",
    );
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("rejects images over 2 MB", async () => {
    const { onUpload } = renderField();
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    });

    await userEvent.upload(screen.getByLabelText("Image file"), big);

    expect(await screen.findByRole("alert")).toHaveTextContent("2 MB");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("shows the server error when the upload fails", async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error("boom"));
    render(
      <ImageUploadField
        label="Image"
        imageUrl={null}
        onUpload={onUpload}
        onRemove={vi.fn()}
      />,
    );

    await userEvent.upload(
      screen.getByLabelText("Image file"),
      new File(["x"], "map.png", { type: "image/png" }),
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("removes the current image", async () => {
    const { onRemove } = renderField("/media/maps/busan.png");

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onRemove).toHaveBeenCalled());
  });
});
