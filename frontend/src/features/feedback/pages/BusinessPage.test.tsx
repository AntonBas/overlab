import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

vi.mock("../api/businessApi", () => ({ sendBusinessMessage: vi.fn() }));

import { sendBusinessMessage } from "../api/businessApi";
import { BusinessPage } from "./BusinessPage";

function renderPage() {
  renderWithRouter(
    <Routes>
      <Route path="/business" element={<BusinessPage />} />
    </Routes>,
    "/business",
  );
}

async function fillForm(message: string) {
  await userEvent.type(
    screen.getByLabelText("Your name or company"),
    "  Jane Partner ",
  );
  await userEvent.type(
    screen.getByLabelText("Email for the reply"),
    "jane@partner.test",
  );
  await userEvent.type(screen.getByLabelText("Message"), message);
}

describe("BusinessPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sendBusinessMessage).mockResolvedValue();
  });

  it("needs a name, an email and a meaningful message", async () => {
    renderPage();
    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();

    await fillForm("too short");
    expect(send).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Message"), " but now longer");
    expect(send).toBeEnabled();
  });

  it("sends the trimmed values and confirms", async () => {
    renderPage();

    await fillForm("We would like to sponsor the site");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(sendBusinessMessage).toHaveBeenCalledWith({
        name: "Jane Partner",
        email: "jane@partner.test",
        message: "We would like to sponsor the site",
      }),
    );
    expect(await screen.findByText(/jane@partner.test/)).toBeInTheDocument();
  });

  it("shows why the message was rejected and keeps the text", async () => {
    vi.mocked(sendBusinessMessage).mockRejectedValue(
      Object.assign(new Error("boom"), {
        isAxiosError: true,
        response: { status: 429, data: { message: "Too many requests" } },
      }),
    );
    renderPage();

    await fillForm("We would like to sponsor the site");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many requests",
    );
    expect(screen.getByLabelText("Message")).toHaveValue(
      "We would like to sponsor the site",
    );
  });
});
