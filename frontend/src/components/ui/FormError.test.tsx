import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormError } from "./FormError";

describe("FormError", () => {
  it("announces the message as an alert", () => {
    render(<FormError>Invalid email or password</FormError>);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
  });
});
