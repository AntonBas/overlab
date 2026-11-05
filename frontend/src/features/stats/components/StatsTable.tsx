import clsx from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { DeltaValue } from "../../../components/ui/DeltaValue";
import { RateBar } from "../../../components/ui/RateBar";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import type { HeroStat, SortDirection, StatsSort } from "../../../types/api";

interface StatsTableProps {
  heroes: HeroStat[];
  showBan: boolean;
  showDelta: boolean;
  sort: StatsSort;
  direction: SortDirection;
  onSort: (sort: StatsSort) => void;
  heroLinkSuffix?: string;
}

interface Column {
  sort: StatsSort;
  label: string;
}

export function StatsTable({
  heroes,
  showBan,
  showDelta,
  sort,
  direction,
  onSort,
  heroLinkSuffix = "",
}: StatsTableProps) {
  const columns: Column[] = [
    { sort: "WIN_RATE", label: "Win rate" },
    { sort: "PICK_RATE", label: "Pick rate" },
  ];
  if (showBan) {
    columns.push({ sort: "BAN_RATE", label: "Ban rate" });
  }

  function ariaSort(column: StatsSort): "ascending" | "descending" | "none" {
    if (sort !== column) {
      return "none";
    }
    return direction === "ASC" ? "ascending" : "descending";
  }

  function icon(column: StatsSort) {
    if (sort !== column) {
      return <ArrowUpDown size={14} aria-hidden="true" />;
    }
    return direction === "ASC" ? (
      <ArrowUp size={14} aria-hidden="true" />
    ) : (
      <ArrowDown size={14} aria-hidden="true" />
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort("NAME")}>
              <button
                type="button"
                className="table__sort"
                onClick={() => onSort("NAME")}
              >
                Hero {icon("NAME")}
              </button>
            </th>
            {columns.map((column) => (
              <th
                key={column.sort}
                scope="col"
                aria-sort={ariaSort(column.sort)}
              >
                <button
                  type="button"
                  className="table__sort"
                  onClick={() => onSort(column.sort)}
                >
                  {column.label} {icon(column.sort)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heroes.map((hero) => (
            <tr key={hero.heroSlug}>
              <th scope="row">
                <span className="table__hero">
                  <HeroPortrait name={hero.heroName} url={hero.portraitUrl} />
                  <RoleBadge role={hero.role} compact />
                  <Link to={`/heroes/${hero.heroSlug}${heroLinkSuffix}`}>
                    {hero.heroName}
                  </Link>
                </span>
              </th>
              <td>
                <RateBar value={hero.winRate} tone="win" />
                {showDelta && <DeltaValue value={hero.winRateDelta} />}
              </td>
              <td>
                <RateBar value={hero.pickRate} tone="pick" max={40} />
                {showDelta && <DeltaValue value={hero.pickRateDelta} />}
              </td>
              {showBan && (
                <td className={clsx({ muted: hero.banRate === null })}>
                  <RateBar value={hero.banRate} tone="ban" max={50} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
