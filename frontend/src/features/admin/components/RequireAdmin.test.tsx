import { screen } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../../test/render";

const auth = vi.hoisted(() => ({
  state: { user: null as unknown, loading: false },
}));

vi.mock("../../auth/context/useAuth", () => ({
  useAuth: () => auth.state,
}));

import { RequireAdmin } from "./RequireAdmin";

function LoginProbe() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return <p>login, return to {from}</p>;
}

function renderGuarded() {
  renderWithRouter(
    <Routes>
      <Route path="/login" element={<LoginProbe />} />
      <Route
        path="/admin/guides"
        element={
          <RequireAdmin>
            <p>admin content</p>
          </RequireAdmin>
        }
      />
    </Routes>,
    "/admin/guides",
  );
}

describe("RequireAdmin", () => {
  beforeEach(() => {
    auth.state = { user: null, loading: false };
  });

  it("waits while the session is loading", () => {
    auth.state = { user: null, loading: true };
    renderGuarded();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("sends anonymous visitors to the login page with a return path", () => {
    renderGuarded();
    expect(
      screen.getByText("login, return to /admin/guides"),
    ).toBeInTheDocument();
  });

  it("shows the not found page to regular users so the admin area stays hidden", () => {
    auth.state = { user: { role: "USER" }, loading: false };
    renderGuarded();
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Access denied")).not.toBeInTheDocument();
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("renders the content for admins", () => {
    auth.state = { user: { role: "ADMIN" }, loading: false };
    renderGuarded();
    expect(screen.getByText("admin content")).toBeInTheDocument();
  });
});
