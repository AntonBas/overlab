import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUnsavedChanges } from "../../../components/admin/unsavedChanges";
import { AdminLayout } from "./AdminLayout";

function DirtyPage() {
  useUnsavedChanges(true);
  return <p>dirty form</p>;
}

function renderAdmin(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<p>dashboard</p>} />
          <Route path="heroes" element={<DirtyPage />} />
          <Route path="users" element={<p>users page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.head.querySelector('meta[name="robots"]')?.remove();
  });

  it("lists the admin sections and names the current one in the breadcrumb", () => {
    renderAdmin("/admin/users");

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toHaveTextContent("Admin");
    expect(breadcrumb.querySelector('[aria-current="page"]')).toHaveTextContent(
      "Users",
    );
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "href",
      "/admin/users",
    );
    expect(screen.getByText("users page")).toBeInTheDocument();
  });

  it("keeps admin pages out of the search index", () => {
    renderAdmin("/admin");

    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
  });

  it("stays on a page with unsaved changes when leaving is declined", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderAdmin("/admin/heroes");

    await user.click(screen.getByRole("link", { name: "Users" }));

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText("dirty form")).toBeInTheDocument();
  });

  it("leaves a page with unsaved changes when leaving is confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderAdmin("/admin/heroes");

    await user.click(screen.getByRole("link", { name: "Users" }));

    expect(await screen.findByText("users page")).toBeInTheDocument();
  });

  it("does not ask for confirmation on a clean page", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderAdmin("/admin/users");

    await user.click(screen.getByRole("link", { name: "Heroes" }));

    expect(confirm).not.toHaveBeenCalled();
  });
});
