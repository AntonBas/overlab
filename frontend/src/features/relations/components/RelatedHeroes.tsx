import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";
import { HeroPortrait } from "../../../components/ui/HeroPortrait";
import { RoleBadge } from "../../../components/ui/RoleBadge";
import { AbilityText } from "../../abilities";
import type { HeroCategory, RelatedHero } from "../../../types/hero";
import type { RelationKind } from "../api/relationFeedbackApi";
import type { RelationFeedback } from "../hooks/useRelationFeedback";
import { ROLE_LABELS } from "../../../utils/format";
import { splitRelationNote } from "../utils/relationNote";
import { RelationVoteButtons } from "./RelationVoteButtons";

export interface RelatedGroup {
  category: HeroCategory;
  note: string | null;
}

interface RelatedHeroesProps {
  heroes: RelatedHero[];
  groups?: RelatedGroup[];
  type: RelationKind;
  feedback?: RelationFeedback;
}

const STACK_SIZE = 4;

function NoteBlocks({ note }: { note: string | null }) {
  if (!note) {
    return null;
  }
  const parts = splitRelationNote(note);
  return (
    <div className="relation-detail__body">
      {parts.reason && (
        <div className="relation-detail__block relation-detail__block--reason">
          {parts.limits && (
            <span className="relation-detail__label">Why it works</span>
          )}
          <AbilityText text={parts.reason} />
        </div>
      )}
      {parts.limits && (
        <div className="relation-detail__block relation-detail__block--limits">
          <span className="relation-detail__label">Limits</span>
          <AbilityText text={parts.limits} />
        </div>
      )}
    </div>
  );
}

function GroupDetail({ group }: { group: RelatedGroup }) {
  const { category } = group;
  return (
    <div
      className="relation-detail relation-detail--group"
      role="region"
      aria-label={`${category.name} group`}
    >
      <div className="relation-detail__header">
        <span className="relation-detail__pill">Hero group</span>
        <span className="muted">
          {category.heroes.length}{" "}
          {category.heroes.length === 1 ? "hero" : "heroes"}
        </span>
      </div>
      <NoteBlocks note={group.note ?? category.description} />
      {category.heroes.length > 0 && (
        <div className="relation-detail__members">
          {category.heroes.map((member) => (
            <Link
              key={member.slug}
              className="relation-detail__member"
              to={`/heroes/${member.slug}`}
            >
              <HeroPortrait
                name={member.name}
                url={member.portraitUrl}
                size={30}
              />
              {member.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const NO_GROUPS: RelatedGroup[] = [];

export function RelatedHeroes({
  heroes,
  groups = NO_GROUPS,
  type,
  feedback,
}: RelatedHeroesProps) {
  const [selectedKey, setSelectedKey] = useState(
    heroes[0] ? `hero:${heroes[0].slug}` : `group:${groups[0]?.category.slug}`,
  );
  const selectedHero = heroes.find(
    (hero) => `hero:${hero.slug}` === selectedKey,
  );
  const selectedGroup = groups.find(
    (group) => `group:${group.category.slug}` === selectedKey,
  );
  const hero = selectedGroup ? undefined : (selectedHero ?? heroes[0]);
  if (!hero && !selectedGroup) {
    return null;
  }

  return (
    <div className="related-heroes">
      <ul className="related-heroes__tiles">
        {groups.map((group) => {
          const key = `group:${group.category.slug}`;
          return (
            <li key={key}>
              <button
                type="button"
                className={clsx("related-tile", "related-tile--group", {
                  "related-tile--active": key === selectedKey,
                })}
                aria-pressed={key === selectedKey}
                onClick={() => setSelectedKey(key)}
              >
                <span className="related-tile__stack">
                  {group.category.heroes.slice(0, STACK_SIZE).map((member) => (
                    <HeroPortrait
                      key={member.slug}
                      name=""
                      url={member.portraitUrl}
                      size={26}
                    />
                  ))}
                  <span className="related-tile__count">
                    {group.category.heroes.length}
                  </span>
                </span>
                <span className="related-tile__name">
                  {group.category.name}
                </span>
                <span className="related-tile__kind">Group</span>
              </button>
            </li>
          );
        })}
        {heroes.map((entry) => {
          const key = `hero:${entry.slug}`;
          const active = hero ? entry.slug === hero.slug : false;
          return (
            <li key={key}>
              <button
                type="button"
                className={clsx(
                  "related-tile",
                  `related-tile--${entry.role.toLowerCase()}`,
                  { "related-tile--active": active },
                )}
                aria-pressed={active}
                onClick={() => setSelectedKey(key)}
              >
                <HeroPortrait
                  name={entry.name}
                  url={entry.portraitUrl}
                  size={60}
                />
                <span className="related-tile__name">{entry.name}</span>
                <span className="related-tile__kind">
                  {ROLE_LABELS[entry.role]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selectedGroup && <GroupDetail group={selectedGroup} />}
      {hero && (
        <div
          className={clsx(
            "relation-detail",
            `relation-detail--${hero.role.toLowerCase()}`,
          )}
          role="region"
          aria-label={`${hero.name} matchup`}
        >
          <div className="relation-detail__header">
            <HeroPortrait name={hero.name} url={hero.portraitUrl} size={40} />
            <RoleBadge role={hero.role} compact />
            <Link className="relation-detail__name" to={`/heroes/${hero.slug}`}>
              {hero.name}
            </Link>
            {feedback && (
              <RelationVoteButtons
                feedback={feedback}
                relatedHeroSlug={hero.slug}
                relatedHeroName={hero.name}
                type={type}
              />
            )}
          </div>
          {hero.note ? (
            <NoteBlocks note={hero.note} />
          ) : (
            <p className="muted">No note yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
