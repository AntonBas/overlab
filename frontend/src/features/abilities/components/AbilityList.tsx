import clsx from "clsx";
import { useId, useState, type KeyboardEvent } from "react";
import { NewBadge } from "../../../components/ui/NewBadge";
import { Thumbnail } from "../../../components/ui/Thumbnail";
import type { Ability, AbilityControl } from "../../../types/hero";
import { ABILITY_CONTROLS } from "../utils/abilityControls";
import { formatAbilityDescription } from "../utils/abilityDescription";
import { AbilityKey } from "./AbilityKey";

function controlRank(control: AbilityControl | null): number {
  const index = control ? ABILITY_CONTROLS.indexOf(control) : -1;
  return index === -1 ? ABILITY_CONTROLS.length : index;
}

function controlClass(control: AbilityControl | null): string {
  return `ability-slot--${(control ?? "none").toLowerCase()}`;
}

export function AbilityList({ abilities }: { abilities: Ability[] }) {
  const baseId = useId();
  const sorted = [...abilities].sort(
    (first, second) => controlRank(first.control) - controlRank(second.control),
  );
  const [selectedSlug, setSelectedSlug] = useState(sorted[0]?.slug);
  const selected =
    sorted.find((ability) => ability.slug === selectedSlug) ?? sorted[0];
  if (!selected) {
    return null;
  }

  function move(event: KeyboardEvent, offset: number) {
    event.preventDefault();
    const index = sorted.findIndex((ability) => ability.slug === selected.slug);
    const target = sorted[(index + offset + sorted.length) % sorted.length];
    setSelectedSlug(target.slug);
    document.getElementById(`${baseId}-slot-${target.slug}`)?.focus();
  }

  return (
    <div className="ability-bar">
      <div className="ability-bar__slots" role="tablist" aria-label="Abilities">
        {sorted.map((ability) => {
          const active = ability.slug === selected.slug;
          return (
            <button
              key={ability.slug}
              id={`${baseId}-slot-${ability.slug}`}
              type="button"
              role="tab"
              className={clsx("ability-slot", controlClass(ability.control), {
                "ability-slot--active": active,
              })}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${ability.slug}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelectedSlug(ability.slug)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  move(event, 1);
                } else if (event.key === "ArrowLeft") {
                  move(event, -1);
                }
              }}
            >
              <span className="ability-slot__icon">
                <Thumbnail url={ability.iconUrl} width={44} height={44} />
              </span>
              <AbilityKey control={ability.control} />
              <span className="ability-slot__name">{ability.name.trim()}</span>
            </button>
          );
        })}
      </div>
      {sorted.map((ability) => (
        <div
          key={ability.slug}
          id={`${baseId}-panel-${ability.slug}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-slot-${ability.slug}`}
          hidden={ability.slug !== selected.slug}
          className={clsx("ability-detail", controlClass(ability.control))}
        >
          <span className="ability-detail__icon">
            <Thumbnail url={ability.iconUrl} width={84} height={84} />
          </span>
          <div className="ability-detail__body">
            <h3 className="ability-detail__title">
              {ability.name.trim()}
              {ability.recentlyAdded && <NewBadge />}
              <AbilityKey control={ability.control} showLabel />
            </h3>
            {ability.description && (
              <p className="ability-detail__text">
                {formatAbilityDescription(ability.description)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
