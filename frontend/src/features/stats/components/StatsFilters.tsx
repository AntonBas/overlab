import type { ReactNode } from "react";
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
import {
  ALL_MAPS,
  ROLES,
  hasDetailedCoverage,
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
  const detailed = hasDetailedCoverage(filters);
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
    <form
      className="filters"
      aria-label="Statistics filters"
      onSubmit={(event) => event.preventDefault()}
    >
      {!quickPlay && (
        <RankFilter
          value={filters.tier}
          disabled={!detailed}
          onChange={(tier) => onChange({ tier })}
        />
      )}

      {maps && (
        <IconSelect
          label="Map"
          value={filters.map}
          options={mapOptions}
          wide
          disabled={!detailed}
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
      {!detailed && (
        <p className="filters__note muted">
          {maps ? "Ranks and maps are" : "Ranks are"} available for PC in Europe
          only. Other platforms and regions show overall statistics.
        </p>
      )}
    </form>
  );
}
