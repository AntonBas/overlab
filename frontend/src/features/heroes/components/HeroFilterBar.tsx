import clsx from "clsx";
import { AllRolesBadge } from "../../../components/ui/AllRolesBadge";
import { FiltersPanel } from "../../../components/ui/FiltersPanel";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import type { HeroRole } from "../../../types/hero";
import { FavoritesFilterButton } from "../../personal";
import { ROLES } from "../../stats";

interface HeroFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  role: HeroRole | null;
  onRoleChange: (role: HeroRole | null) => void;
  onlyFavorites: boolean;
  onOnlyFavoritesChange: (onlyFavorites: boolean) => void;
}

export function HeroFilterBar({
  query,
  onQueryChange,
  role,
  onRoleChange,
  onlyFavorites,
  onOnlyFavoritesChange,
}: HeroFilterBarProps) {
  return (
    <FiltersPanel>
      <div className="filters">
        <label className="field">
          <span className="field__label">Hero</span>
          <input
            type="search"
            value={query}
            placeholder="Search by name"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <div className="field">
          <span className="field__label">Role</span>
          <div className="segmented" role="group" aria-label="Role">
            {[null, ...ROLES].map((value) => (
              <button
                key={value ?? "all"}
                type="button"
                className={clsx("segmented__item", {
                  "segmented__item--active": role === value,
                })}
                aria-pressed={role === value}
                onClick={() => onRoleChange(value)}
              >
                {value ? (
                  <RoleBadge role={value} />
                ) : (
                  <AllRolesBadge label="All" />
                )}
              </button>
            ))}
          </div>
        </div>
        <FavoritesFilterButton
          active={onlyFavorites}
          onToggle={() => onOnlyFavoritesChange(!onlyFavorites)}
        />
      </div>
    </FiltersPanel>
  );
}
