import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordChecklist } from "./PasswordChecklist";

function status(label: string): string {
  return screen.getByText(new RegExp(label)).closest("li")!.textContent ?? "";
}

describe("PasswordChecklist", () => {
  it("starts with nothing met", () => {
    render(<PasswordChecklist password="" confirmation="" />);

    expect(status("At least 8")).toContain("(not met yet)");
    expect(status("Passwords match")).toContain("(not met yet)");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ticks the length and the match as they are satisfied", () => {
    render(
      <PasswordChecklist
        password="long-enough-1"
        confirmation="long-enough-1"
      />,
    );

    expect(status("At least 8")).toContain("(met)");
    expect(status("Passwords match")).toContain("(met)");
    expect(screen.queryByText(/too long/)).not.toBeInTheDocument();
  });

  it("warns about the byte limit only when the password is too long", () => {
    const { rerender } = render(
      <PasswordChecklist password={"ж".repeat(30)} confirmation="" />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<PasswordChecklist password={"ж".repeat(40)} confirmation="" />);

    expect(screen.getByRole("alert")).toHaveTextContent("too long");
  });

  it("does not report a match for different values", () => {
    render(<PasswordChecklist password="long-enough-1" confirmation="other" />);

    expect(status("Passwords match")).toContain("(not met yet)");
  });
});
