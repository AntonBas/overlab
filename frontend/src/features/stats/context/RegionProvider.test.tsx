import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Preferences } from "../../../types/api";
import { RegionProvider } from "./RegionProvider";
import { useRegion } from "./useRegion";

let preferences: Preferences | null = null;

vi.mock("../../personal/context/usePersonalData", () => ({
  usePersonalData: () => ({ preferences, replacePreferences }),
}));

const savePreferences = vi.hoisted(() => vi.fn());
const replacePreferences = vi.fn();
vi.mock("../../personal/api/personalApi", () => ({ savePreferences }));

function Probe() {
  const { region, rememberRegion } = useRegion();
  return (
    <>
      <p>{region}</p>
      <button type="button" onClick={() => rememberRegion("ASIA")}>
        asia
      </button>
    </>
  );
}

function renderProbe() {
  render(
    <RegionProvider>
      <Probe />
    </RegionProvider>,
  );
}

afterEach(() => {
  window.localStorage.clear();
  preferences = null;
  savePreferences.mockReset();
  replacePreferences.mockReset();
  vi.restoreAllMocks();
});

describe("RegionProvider", () => {
  it("uses the region of the time zone when nothing is saved", () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      timeZone: "America/New_York",
    } as Intl.ResolvedDateTimeFormatOptions);

    renderProbe();

    expect(screen.getByText("AMERICAS")).toBeInTheDocument();
  });

  it("prefers the saved profile region over the time zone", () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      timeZone: "America/New_York",
    } as Intl.ResolvedDateTimeFormatOptions);
    preferences = { queue: null, platform: null, region: "ASIA", tier: null };

    renderProbe();

    expect(screen.getByText("ASIA")).toBeInTheDocument();
  });

  it("remembers a chosen region over everything else", async () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
      timeZone: "Europe/Kyiv",
    } as Intl.ResolvedDateTimeFormatOptions);

    renderProbe();
    await userEvent.click(screen.getByRole("button", { name: "asia" }));

    expect(screen.getByText("ASIA")).toBeInTheDocument();
    expect(window.localStorage.getItem("overlab.region")).toBe("ASIA");
  });

  it("saves the chosen region to the profile of a signed in user", async () => {
    preferences = { queue: null, platform: null, region: null, tier: null };
    const saved = { ...preferences, region: "ASIA" as const };
    savePreferences.mockResolvedValue(saved);

    renderProbe();
    await userEvent.click(screen.getByRole("button", { name: "asia" }));

    expect(savePreferences).toHaveBeenCalledWith(saved);
    expect(replacePreferences).toHaveBeenCalledWith(saved);
  });

  it("does not call the profile api for anonymous visitors", async () => {
    renderProbe();
    await userEvent.click(screen.getByRole("button", { name: "asia" }));

    expect(savePreferences).not.toHaveBeenCalled();
  });
});
