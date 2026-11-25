import clsx from "clsx";
import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { Tooltip } from "../../../components/ui/Tooltip";
import type { RelatedHero } from "../../../types/hero";
import type { RelationKind } from "../api/relationFeedbackApi";
import type { RelationFeedback } from "../hooks/useRelationFeedback";
import { AbilityText } from "../../abilities";
import { RelationVoteButtons } from "./RelationVoteButtons";

interface RelationAvatarProps {
  hero: RelatedHero;
  to: string;
  type: RelationKind;
  feedback: RelationFeedback;
}

export function RelationAvatar({
  hero,
  to,
  type,
  feedback,
}: RelationAvatarProps) {
  return (
    <li>
      <Tooltip
        interactive
        mount="open"
        role="dialog"
        label={`${hero.name}: note and vote`}
        tipClassName="perk-tip perk-tip--interactive"
        content={
          <>
            <span className="perk-tip__header">
              <HeroPortrait name={hero.name} url={hero.portraitUrl} size={36} />
              <span className="perk-tip__title">
                <strong>{hero.name}</strong>
                <RoleBadge role={hero.role} compact />
              </span>
              <span className="perk-tip__actions">
                <RelationVoteButtons
                  feedback={feedback}
                  relatedHeroSlug={hero.slug}
                  relatedHeroName={hero.name}
                  type={type}
                />
              </span>
            </span>
            <span className="perk-tip__text">
              {hero.note ? <AbilityText text={hero.note} /> : "No note yet."}
            </span>
          </>
        }
      >
        {({ describedBy }) => (
          <Link
            className={clsx(
              "relation-avatar",
              `relation-avatar--${hero.role.toLowerCase()}`,
            )}
            to={to}
            title={hero.name}
            aria-describedby={describedBy}
          >
            <span className="relation-avatar__image">
              <HeroPortrait name={hero.name} url={hero.portraitUrl} size={32} />
            </span>
            <span className="relation-avatar__name">{hero.name}</span>
          </Link>
        )}
      </Tooltip>
    </li>
  );
}
