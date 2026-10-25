import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RequestFailure } from "../../services/api";
import { ErrorMessage } from "./ErrorMessage";

function failure(overrides: Partial<RequestFailure>): RequestFailure {
  return {
    status: 500,
    message: "Internal server error",
    fieldErrors: {},
    network: false,
    ...overrides,
  };
}

describe("ErrorMessage", () => {
  it("explains a server error and offers to retry", async () => {
    const onRetry = vi.fn();
    render(<ErrorMessage failure={failure({})} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("offers to retry when the server cannot be reached", () => {
    render(
      <ErrorMessage
        failure={failure({ status: 0, network: true })}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("not reachable");
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("does not offer a pointless retry for a missing item", () => {
    render(
      <ErrorMessage failure={failure({ status: 404 })} onRetry={vi.fn()} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("could not find");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("asks the visitor to wait when rate limited", () => {
    render(<ErrorMessage failure={failure({ status: 429 })} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Too many requests");
  });
});
