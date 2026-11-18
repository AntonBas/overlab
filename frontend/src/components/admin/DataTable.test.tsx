import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./DataTable";

const columns = [
  { header: "Name", render: (row: { name: string }) => row.name },
];

describe("DataTable", () => {
  it("shows the toolbar action next to the search", () => {
    render(
      <DataTable
        rows={[{ name: "Ana" }]}
        columns={columns}
        rowKey={(row) => row.name}
        searchLabel="Search"
        matches={() => true}
        toolbar={<button type="button">New hero</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "New hero" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search" }),
    ).toBeInTheDocument();
  });

  it("keeps the toolbar action when there are no rows yet", () => {
    render(
      <DataTable
        rows={[]}
        columns={columns}
        rowKey={() => 0}
        emptyMessage="No heroes yet."
        toolbar={<button type="button">New hero</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "New hero" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No heroes yet.")).toBeInTheDocument();
  });
});
