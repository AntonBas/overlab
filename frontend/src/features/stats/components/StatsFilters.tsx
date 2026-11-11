import type { ReactNode } from "react";
import { FiltersPanel } from "../../../components/ui/FiltersPanel";
import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import { AllItemsIcon } from "../../../components/ui/AllItemsIcon";
import {
  IconSelect,
  type IconSelectOption,
} from "../../../components/ui/IconSelect";
import { RankFilter } from "../../../components/ui/RankFilter";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import clsx from "clsx";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { GameMap, HeroRole } from "../../../types/api";
import { PLATFORM_OPTIONS, REGION_OPTIONS } from "../filterOptions";
import { useCoverage } from "../context/useCoverage";
import {
  ALL_MAPS,
  ROLES,
  availableTiers,
  hasMapCoverage,
  isQuickPlay,
  type StatsFilters as Filters,
} from "../filters";

const MAP_ICON_SIZE = 24;

interface StatsFiltersProps {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  maps?: GameMap[];
  search?: string;
  onSearchChange?: (value: string) => void;
  children?: ReactNode;
}

export function StatsFilters({
  filters,
  onChange,
  maps,
  search,
  onSearchChange,
  children,
}: StatsFiltersProps) {
  const quickPlay = isQuickPlay(filters);
  const coverage = useCoverage();
  const tiers = availableTiers(coverage, filters);
  const mapCoverage = hasMapCoverage(coverage, filters);
  const mapOptions: IconSelectOption<string>[] = [
    { value: ALL_MAPS, label: "All maps", icon: <AllItemsIcon /> },
    ...(maps ?? []).map((map) => ({
      value: map.slug,
      label: map.name,
      icon: (
        <Thumbnail
          url={map.imageUrl}
          width={MAP_ICON_SIZE}
          height={MAP_ICON_SIZE}
          eager
        />
      ),
    })),
  ];
  return (
    <FiltersPanel>
      <form
        className="filters"
        aria-label="Statistics filters"
        onSubmit={(event) => event.preventDefault()}
      >
        {!quickPlay && (
          <RankFilter
            value={filters.tier}
            tiers={tiers}
            onChange={(tier) => onChange({ tier })}
          />
        )}

        {maps && (
          <IconSelect
            label="Map"
            value={filters.map}
            options={mapOptions}
            wide
            searchable
            disabled={!mapCoverage}
            onChange={(map) => onChange({ map })}
          />
        )}

        {children}

        <IconSelect
          label="Platform"
          value={filters.platform}
          options={PLATFORM_OPTIONS}
          onChange={(platform) => onChange({ platform })}
        />

        <IconSelect
          label="Region"
          value={filters.region}
          options={REGION_OPTIONS}
          onChange={(region) => onChange({ region })}
        />

        {onSearchChange && (
          <label className="field">
            <span className="field__label">Hero</span>
            <input
              type="search"
              value={search ?? ""}
              placeholder="Search by name"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        )}

        <div className="segmented" role="group" aria-label="Role">
          <button
            type="button"
            className={clsx("segmented__item", {
              "segmented__item--active": filters.role === null,
            })}
            aria-pressed={filters.role === null}
            onClick={() => onChange({ role: null })}
          >
            <AllRolesBadge label="All roles" />
          </button>
          {ROLES.map((role: HeroRole) => (
            <button
              key={role}
              type="button"
              className={clsx("segmented__item", {
                "segmented__item--active": filters.role === role,
              })}
              aria-pressed={filters.role === role}
              onClick={() => onChange({ role })}
            >
              <RoleBadge role={role} />
            </button>
          ))}
        </div>
        {tiers.length <= 1 && !quickPlay && (
          <p className="filters__note muted">
            Ranks are not collected for this platform and region yet. Overall
            statistics are shown.
          </p>
        )}
        {maps && !mapCoverage && (
          <p className="filters__note muted">
            Map statistics are not collected for this platform and region yet.
          </p>
        )}
      </form>
    </FiltersPanel>
  );
}
