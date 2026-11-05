import clsx from "clsx";
import { useId } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { useFloatingTip } from "../../../hooks/useFloatingTip";
import type { RelatedHero } from "../../../types/api";
import { AbilityText } from "./AbilityText";
import { Strength } from "./RelatedHeroes";

export function RelationAvatar({ hero }: { hero: RelatedHero }) {
  const tipId = useId();
  const { open, style, triggerRef, tipRef, triggerProps, tipProps } =
    useFloatingTip();
  return (
    <li>
      <span ref={triggerRef} {...triggerProps}>
        <Link
          className={clsx(
            "relation-avatar",
            `relation-avatar--${hero.role.toLowerCase()}`,
          )}
          to={`/heroes/${hero.slug}`}
          aria-describedby={open ? tipId : undefined}
        >
          <span className="relation-avatar__image">
            <HeroPortrait name={hero.name} url={hero.portraitUrl} size={32} />
          </span>
          <span className="relation-avatar__name">{hero.name}</span>
        </Link>
      </span>
      {open &&
        createPortal(
          <span
            id={tipId}
            role="tooltip"
            ref={tipRef}
            className="perk-tip perk-tip--interactive"
            style={style}
            {...tipProps}
          >
            <span className="perk-tip__header">
              <HeroPortrait name={hero.name} url={hero.portraitUrl} size={36} />
              <span className="perk-tip__title">
                <strong>{hero.name}</strong>
                <RoleBadge role={hero.role} compact />
              </span>
              <Strength value={hero.strength} />
            </span>
            <span className="perk-tip__text">
              {hero.note ? <AbilityText text={hero.note} /> : "No note yet."}
            </span>
          </span>,
          document.body,
        )}
    </li>
  );
}
