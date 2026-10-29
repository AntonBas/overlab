import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRoleIconChecks } from "../../utils/roleIcons";
import { RoleBadge } from "./RoleBadge";

class LoadingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

class MissingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.());
  }
}

describe("RoleBadge", () => {
  beforeEach(() => {
    resetRoleIconChecks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the downloaded role icon when it exists", async () => {
    vi.stubGlobal("Image", LoadingImage);

    const { container } = render(<RoleBadge role="TANK" />);

    await waitFor(() =>
      expect(container.querySelector(".role-badge__image")).not.toBeNull(),
    );
    expect(container.querySelector("svg.role-badge__icon")).toBeNull();
    expect(screen.getByText("Tank")).toBeInTheDocument();
  });

  it("keeps the built-in icon when the file is missing", async () => {
    vi.stubGlobal("Image", MissingImage);

    const { container } = render(<RoleBadge role="DAMAGE" />);

    await waitFor(() =>
      expect(container.querySelector("svg.role-badge__icon")).not.toBeNull(),
    );
    expect(container.querySelector(".role-badge__image")).toBeNull();
  });

  it("only names the role for screen readers in the compact form", () => {
    const { container } = render(<RoleBadge role="SUPPORT" compact />);

    expect(screen.getByText("Support")).toHaveClass("visually-hidden");
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
