import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { EmptyState } from "../../../components/ui/EmptyState";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import type { HeroChange } from "../../../types/stats";
import { ROLE_LABELS, formatDate, formatPercent } from "../../../utils/format";
import { sortChanges, type ChangeSort } from "../utils/changes";

interface ChangesTableProps {
  changes: HeroChange[];
  showBan: boolean;
}

const DELTA_TITLE = "Change between the two snapshots";

interface ChangeCellProps {
  before: number;
  after: number;
  change: number | null;
}

function ChangeCell({ before, after, change }: ChangeCellProps) {
  return (
    <span className="change">
      <span className="change__value">{formatPercent(before)}</span>
      <span className="change__arrow">→</span>
      <span className="change__value">{formatPercent(after)}</span>
      <DeltaValue value={change} title={DELTA_TITLE} />
    </span>
  );
}

export function ChangesTable({ changes, showBan }: ChangesTableProps) {
  const [sort, setSort] = useState<ChangeSort>("WIN_CHANGE");
  const [descending, setDescending] = useState(true);
  const activeSort: ChangeSort =
    !showBan && sort === "BAN_CHANGE" ? "WIN_CHANGE" : sort;
  const rows = useMemo(
    () => sortChanges(changes, activeSort, descending),
    [changes, activeSort, descending],
  );

  function toggle(next: ChangeSort) {
    if (next === activeSort) {
      setDescending((current) => !current);
    } else {
      setSort(next);
      setDescending(next !== "NAME");
    }
  }

  function ariaSort(column: ChangeSort): "ascending" | "descending" | "none" {
    if (column !== activeSort) {
      return "none";
    }
    return descending ? "descending" : "ascending";
  }

  function icon(column: ChangeSort) {
    if (column !== activeSort) {
      return <ArrowUpDown size={14} aria-hidden="true" />;
    }
    return descending ? (
      <ArrowDown size={14} aria-hidden="true" />
    ) : (
      <ArrowUp size={14} aria-hidden="true" />
    );
  }

  if (changes.length === 0) {
    return (
      <EmptyState kind="no-match">No heroes match these filters.</EmptyState>
    );
  }

  const sortOptions: { value: ChangeSort; label: string }[] = [
    { value: "NAME", label: "Hero" },
    { value: "WIN_CHANGE", label: "Win rate" },
    { value: "PICK_CHANGE", label: "Pick rate" },
    ...(showBan ? [{ value: "BAN_CHANGE" as const, label: "Ban rate" }] : []),
  ];

  return (
    <>
      <div className="table-sort">
        <label className="table-sort__field">
          <span className="field__label">Sort by</span>
          <select
            value={activeSort}
            onChange={(event) => toggle(event.target.value as ChangeSort)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button button--ghost"
          aria-label={descending ? "Sorted descending" : "Sorted ascending"}
          onClick={() => setDescending((current) => !current)}
        >
          {descending ? (
            <ArrowDown size={16} aria-hidden="true" />
          ) : (
            <ArrowUp size={16} aria-hidden="true" />
          )}
        </button>
      </div>
      <div className="table-wrap table-wrap--ranking">
        <table className="table table--cards">
          <thead>
            <tr>
              <th scope="col" aria-sort={ariaSort("NAME")}>
                <button
                  type="button"
                  className="table__sort"
                  onClick={() => toggle("NAME")}
                >
                  Hero {icon("NAME")}
                </button>
              </th>
              <th scope="col" aria-sort={ariaSort("WIN_CHANGE")}>
                <button
                  type="button"
                  className="table__sort"
                  onClick={() => toggle("WIN_CHANGE")}
                >
                  Win rate {icon("WIN_CHANGE")}
                </button>
              </th>
              <th scope="col" aria-sort={ariaSort("PICK_CHANGE")}>
                <button
                  type="button"
                  className="table__sort"
                  onClick={() => toggle("PICK_CHANGE")}
                >
                  Pick rate {icon("PICK_CHANGE")}
                </button>
              </th>
              {showBan && (
                <th scope="col" aria-sort={ariaSort("BAN_CHANGE")}>
                  <button
                    type="button"
                    className="table__sort"
                    onClick={() => toggle("BAN_CHANGE")}
                  >
                    Ban rate {icon("BAN_CHANGE")}
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((change) => (
              <tr key={change.heroSlug} data-role={change.role.toLowerCase()}>
                <th scope="row">
                  <span className="table__hero">
                    <HeroPortrait
                      name={change.heroName}
                      url={change.portraitUrl}
                    />
                    <RoleBadge role={change.role} compact />
                    <Link to={`/heroes/${change.heroSlug}`}>
                      {change.heroName}
                    </Link>
                    {change.roleChange && (
                      <span
                        className="table__flag"
                        title={`Moved from ${ROLE_LABELS[change.roleChange.previousRole]} to ${ROLE_LABELS[change.roleChange.newRole]} on ${formatDate(change.roleChange.changedAt)}, so the numbers before and after are not directly comparable.`}
                      >
                        Role changed
                      </span>
                    )}
                  </span>
                </th>
                <td
                  data-label="Win rate"
                  className={clsx({
                    "table__col--sorted": activeSort === "WIN_CHANGE",
                  })}
                >
                  <ChangeCell
                    before={change.winRateBefore}
                    after={change.winRateAfter}
                    change={change.winRateChange}
                  />
                </td>
                <td
                  data-label="Pick rate"
                  className={clsx({
                    "table__col--sorted": activeSort === "PICK_CHANGE",
                  })}
                >
                  <ChangeCell
                    before={change.pickRateBefore}
                    after={change.pickRateAfter}
                    change={change.pickRateChange}
                  />
                </td>
                {showBan && (
                  <td
                    data-label="Ban rate"
                    className={clsx({
                      "table__col--sorted": activeSort === "BAN_CHANGE",
                    })}
                  >
                    {change.banRateBefore === null ||
                    change.banRateAfter === null ? (
                      "-"
                    ) : (
                      <ChangeCell
                        before={change.banRateBefore}
                        after={change.banRateAfter}
                        change={change.banRateChange}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
