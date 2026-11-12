import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./routes/AppRoutes", () => ({
  AppRoutes: () => <p>routes</p>,
}));
vi.mock("./features/auth/context/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./features/personal/context/PersonalDataProvider", () => ({
  PersonalDataProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));
vi.mock("./features/stats/context/CoverageProvider", () => ({
  CoverageProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./features/heroes/context/AbilitiesProvider", () => ({
  AbilitiesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("App", () => {
  it("mounts the provider tree and renders the routes", () => {
    render(<App />);

    expect(screen.getByText("routes")).toBeInTheDocument();
  });
});
