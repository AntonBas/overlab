import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { EmptyState } from "../../../components/ui/EmptyState";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import type { HeroChange, HeroRole } from "../../../types/api";
import { formatPercent } from "../../../utils/format";
import { ROLES } from "../../stats/filters";
import { sortChanges, type ChangeSort } from "../utils/changes";

interface ChangesTableProps {
  changes: HeroChange[];
  showBan: boolean;
  portraits?: Record<string, string | null>;
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

export function ChangesTable({
  changes,
  showBan,
  portraits = {},
}: ChangesTableProps) {
  const [sort, setSort] = useState<ChangeSort>("WIN_CHANGE");
  const [descending, setDescending] = useState(true);
  const [role, setRole] = useState<HeroRole | null>(null);
  const rows = useMemo(
    () => sortChanges([...changes], sort, descending, role),
    [changes, sort, descending, role],
  );

  function toggle(next: ChangeSort) {
    if (next === sort) {
      setDescending((current) => !current);
    } else {
      setSort(next);
      setDescending(next !== "NAME");
    }
  }

  function ariaSort(column: ChangeSort): "ascending" | "descending" | "none" {
    if (column !== sort) {
      return "none";
    }
    return descending ? "descending" : "ascending";
  }

  function icon(column: ChangeSort) {
    if (column !== sort) {
      return <ArrowUpDown size={14} aria-hidden="true" />;
    }
    return descending ? (
      <ArrowDown size={14} aria-hidden="true" />
    ) : (
      <ArrowUp size={14} aria-hidden="true" />
    );
  }

  if (changes.length === 0) {
    return <EmptyState>No heroes appear in both snapshots.</EmptyState>;
  }

  return (
    <>
      <div className="table-toolbar">
        <div className="segmented" role="group" aria-label="Role">
          <button
            type="button"
            className={clsx("segmented__item", {
              "segmented__item--active": role === null,
            })}
            aria-pressed={role === null}
            onClick={() => setRole(null)}
          >
            <AllRolesBadge label="All roles" />
          </button>
          {ROLES.map((entry) => (
            <button
              key={entry}
              type="button"
              className={clsx("segmented__item", {
                "segmented__item--active": role === entry,
              })}
              aria-pressed={role === entry}
              onClick={() => setRole(entry)}
            >
              <RoleBadge role={entry} />
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
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
              {showBan && <th scope="col">Ban rate</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((change) => (
              <tr key={change.heroSlug}>
                <th scope="row">
                  <span className="table__hero">
                    <HeroPortrait
                      name={change.heroName}
                      url={portraits[change.heroSlug] ?? null}
                    />
                    <Link to={`/heroes/${change.heroSlug}`}>
                      {change.heroName}
                    </Link>
                    <RoleBadge role={change.role} compact />
                  </span>
                </th>
                <td>
                  <ChangeCell
                    before={change.winRateBefore}
                    after={change.winRateAfter}
                    change={change.winRateChange}
                  />
                </td>
                <td>
                  <ChangeCell
                    before={change.pickRateBefore}
                    after={change.pickRateAfter}
                    change={change.pickRateChange}
                  />
                </td>
                {showBan && (
                  <td>
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
