import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./Header", () => ({ Header: () => <header>site header</header> }));
vi.mock("./Footer", () => ({ Footer: () => <footer>site footer</footer> }));
vi.mock("../../features/legal", () => ({
  CookieBanner: () => <div>cookie banner</div>,
  AnalyticsLoader: () => null,
  ErrorReportingLoader: () => null,
}));

import { Layout } from "./Layout";

function Broken(): never {
  throw new Error("page crashed");
}

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <>
                <p>home page</p>
                <Link to="/other">go other</Link>
                <Link to="/broken">go broken</Link>
              </>
            }
          />
          <Route
            path="/other"
            element={
              <>
                <p>other page</p>
                <Link to="/">go home</Link>
              </>
            }
          />
          <Route path="/broken" element={<Broken />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("Layout", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  it("wraps the page in the header, footer and cookie banner with a skip link", () => {
    renderLayout();

    expect(screen.getByText("site header")).toBeInTheDocument();
    expect(screen.getByText("site footer")).toBeInTheDocument();
    expect(screen.getByText("cookie banner")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#content");
    expect(screen.getByRole("main")).toHaveTextContent("home page");
  });

  it("scrolls to the top and focuses the content after navigating to a new page", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("link", { name: "go other" }));

    expect(await screen.findByText("other page")).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("shows an error for a crashed page and keeps the header", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("link", { name: "go broken" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("site header")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
