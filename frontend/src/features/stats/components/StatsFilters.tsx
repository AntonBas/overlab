import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import { AllItemsIcon } from "../../../components/ui/AllItemsIcon";
import {
  IconSelect,
  type IconSelectOption,
} from "../../../components/ui/IconSelect";
import { RankFilter } from "../../../components/ui/RankFilter";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import clsx from "clsx";
import { Gamepad2, Globe, Monitor } from "lucide-react";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { GameMap, HeroRole, Platform, Region } from "../../../types/api";
import {
  PLATFORM_LABELS,
  QUEUE_LABELS,
  REGION_LABELS,
} from "../../../utils/format";
import {
  ALL_MAPS,
  PLATFORMS,
  QUEUES,
  REGIONS,
  ROLES,
  hasDetailedCoverage,
  isQuickPlay,
  type StatsFilters as Filters,
} from "../filters";

const MAP_ICON_SIZE = 24;

const PLATFORM_OPTIONS: readonly IconSelectOption<Platform>[] = PLATFORMS.map(
  (platform) => ({
    value: platform,
    label: PLATFORM_LABELS[platform],
    icon:
      platform === "PC" ? (
        <Monitor aria-hidden="true" size={18} />
      ) : (
        <Gamepad2 aria-hidden="true" size={18} />
      ),
  }),
);

const REGION_OPTIONS: readonly IconSelectOption<Region>[] = REGIONS.map(
  (region) => ({
    value: region,
    label: REGION_LABELS[region],
    icon: <Globe aria-hidden="true" size={18} />,
  }),
);

interface StatsFiltersProps {
  filters: Filters;
  maps: GameMap[];
  onChange: (patch: Partial<Filters>) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function StatsFilters({
  filters,
  maps,
  onChange,
  search,
  onSearchChange,
}: StatsFiltersProps) {
  const quickPlay = isQuickPlay(filters);
  const detailed = hasDetailedCoverage(filters);
  const mapOptions: IconSelectOption<string>[] = [
    { value: ALL_MAPS, label: "All maps", icon: <AllItemsIcon /> },
    ...maps.map((map) => ({
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
      <div className="segmented" role="group" aria-label="Game mode">
        {QUEUES.map((queue) => (
          <button
            key={queue}
            type="button"
            className={clsx("segmented__item", {
              "segmented__item--active": filters.queue === queue,
            })}
            aria-pressed={filters.queue === queue}
            onClick={() => onChange({ queue })}
          >
            {QUEUE_LABELS[queue]}
          </button>
        ))}
      </div>

      {!quickPlay && (
        <RankFilter
          value={filters.tier}
          disabled={!detailed}
          onChange={(tier) => onChange({ tier })}
        />
      )}

      <IconSelect
        label="Map"
        value={filters.map}
        options={mapOptions}
        wide
        disabled={!detailed}
        onChange={(map) => onChange({ map })}
      />

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

      <label className="field">
        <span className="field__label">Hero</span>
        <input
          type="search"
          value={search}
          placeholder="Search by name"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

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
          Ranks and maps are available for PC in Europe only. Other platforms
          and regions show overall statistics.
        </p>
      )}
    </form>
  );
}
