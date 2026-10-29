import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleTags } from "./RoleTags";

describe("RoleTags", () => {
  it("shows the role and a capitalised subrole", () => {
    render(<RoleTags role="TANK" subrole="stalwart" />);

    expect(screen.getByText("Tank")).toBeInTheDocument();
    expect(screen.getByText("Stalwart")).toBeInTheDocument();
    expect(screen.queryByText("stalwart")).not.toBeInTheDocument();
  });

  it("describes the role and subrole with tooltips tied to their chips", () => {
    render(<RoleTags role="SUPPORT" subrole="medic" />);

    const roleButton = screen.getByRole("button", { name: /Support/ });
    const subroleButton = screen.getByRole("button", { name: /Medic/ });

    expect(roleButton).toHaveAccessibleDescription(
      "Support heroes heal, protect and empower their team.",
    );
    expect(subroleButton).toHaveAccessibleDescription(
      "Focuses on raw healing to keep teammates alive.",
    );
  });

  it("shows a subrole without a description as plain text", () => {
    render(<RoleTags role="DAMAGE" subrole="newcomer" />);

    expect(screen.getByText("Newcomer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Newcomer/ })).toBeNull();
  });

  it("omits the subrole chip when there is none", () => {
    render(<RoleTags role="DAMAGE" subrole={null} />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
