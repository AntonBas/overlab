import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import clsx from "clsx";
import type { GameMap, HeroRole } from "../../../types/api";
import {
  PLATFORM_LABELS,
  QUEUE_LABELS,
  REGION_LABELS,
  TIER_LABELS,
} from "../../../utils/format";
import {
  ALL_MAPS,
  PLATFORMS,
  QUEUES,
  REGIONS,
  ROLES,
  TIERS,
  isQuickPlay,
  type StatsFilters as Filters,
} from "../filters";

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

      <label className="field">
        <span className="field__label">Rank</span>
        <select
          value={filters.tier}
          disabled={quickPlay}
          title={quickPlay ? "Quick Play has no ranks" : undefined}
          onChange={(event) =>
            onChange({ tier: event.target.value as Filters["tier"] })
          }
        >
          {TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {TIER_LABELS[tier]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Map</span>
        <select
          value={filters.map}
          onChange={(event) => onChange({ map: event.target.value })}
        >
          <option value={ALL_MAPS}>All maps</option>
          {maps.map((map) => (
            <option key={map.slug} value={map.slug}>
              {map.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Platform</span>
        <select
          value={filters.platform}
          onChange={(event) =>
            onChange({ platform: event.target.value as Filters["platform"] })
          }
        >
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Region</span>
        <select
          value={filters.region}
          onChange={(event) =>
            onChange({ region: event.target.value as Filters["region"] })
          }
        >
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {REGION_LABELS[region]}
            </option>
          ))}
        </select>
      </label>

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
    </form>
  );
}
