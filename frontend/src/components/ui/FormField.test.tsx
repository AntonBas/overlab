import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("reveals and hides a password with the eye button", async () => {
    render(<FormField label="Password" name="password" type="password" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "Show password" }),
    );
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(
      screen.getByRole("button", { name: "Hide password" }),
    );
    expect(input).toHaveAttribute("type", "password");
  });

  it("has no eye button for other fields", () => {
    render(<FormField label="Email" name="email" type="email" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
