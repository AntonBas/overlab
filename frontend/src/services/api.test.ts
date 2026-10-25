import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { toFailure } from "./api";

function axiosError(status: number | null, data?: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response =
    status === null
      ? undefined
      : { status, data, statusText: "", headers: {}, config };
  return new AxiosError("Request failed", "ERR", config, null, response);
}

describe("toFailure", () => {
  it("reads the message and field errors from the API error body", () => {
    const failure = toFailure(
      axiosError(400, {
        message: "Validation failed",
        subErrors: [{ field: "email", message: "must be a well-formed email" }],
      }),
    );

    expect(failure.status).toBe(400);
    expect(failure.message).toBe("Validation failed");
    expect(failure.fieldErrors).toEqual({
      email: "must be a well-formed email",
    });
    expect(failure.network).toBe(false);
  });

  it("marks a response-less error as a network failure", () => {
    const failure = toFailure(axiosError(null));

    expect(failure.network).toBe(true);
    expect(failure.status).toBe(0);
  });

  it("handles errors that did not come from axios", () => {
    expect(toFailure(new Error("boom")).message).toBe("boom");
    expect(toFailure("text").message).toBe("Unknown error");
  });
});
