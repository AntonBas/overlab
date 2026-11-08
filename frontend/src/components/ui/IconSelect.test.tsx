import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconSelect } from "./IconSelect";

const OPTIONS = [
  { value: "ana", label: "Ana" },
  { value: "junker-queen", label: "Junker Queen" },
  { value: "junkrat", label: "Junkrat" },
];

function renderSelect(searchable: boolean, onChange = vi.fn()) {
  render(
    <IconSelect
      label="Hero"
      value="ana"
      options={OPTIONS}
      searchable={searchable}
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("IconSelect", () => {
  it("has no search field unless it is searchable", async () => {
    renderSelect(false);

    await userEvent.click(screen.getByRole("combobox"));

    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filters the options while typing and picks the first match with Enter", async () => {
    const onChange = renderSelect(true);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("searchbox"), "junk q");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    await userEvent.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("junker-queen");
  });

  it("says when nothing matches", async () => {
    renderSelect(true);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("searchbox"), "zzz");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("Nothing found")).toBeInTheDocument();
  });
});
