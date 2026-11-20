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
import { CATEGORY_GROUP_LABELS, categoryStyleOf } from "../utils/categoryStyle";
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
  const { icon: Icon, group: styleGroup } = categoryStyleOf(category.slug);
  return (
    <div
      className="relation-detail relation-detail--group"
      data-group={styleGroup}
      role="region"
      aria-label={`${category.name} group`}
    >
      <div className="relation-detail__header">
        <span className="category-icon category-icon--large">
          <Icon className="category-icon__glyph" aria-hidden="true" />
        </span>
        <span className="relation-detail__title">
          <span className="relation-detail__name">{category.name}</span>
          <span className="relation-detail__meta">
            {CATEGORY_GROUP_LABELS[styleGroup]} · {category.heroes.length}{" "}
            {category.heroes.length === 1 ? "hero" : "heroes"}
          </span>
        </span>
      </div>
      <NoteBlocks note={group.note ?? category.description} />
      {category.heroes.length > 0 && (
        <div className="relation-detail__members">
          {category.heroes.map((member) => (
            <Link
              key={member.slug}
              className={clsx(
                "relation-detail__member",
                `relation-detail__member--${member.role.toLowerCase()}`,
              )}
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
      {groups.length > 0 && (
        <div className="related-heroes__section">
          {heroes.length > 0 && (
            <span className="related-heroes__label">Hero types</span>
          )}
          <ul className="related-heroes__tiles">
            {groups.map((group) => {
              const key = `group:${group.category.slug}`;
              const { icon: Icon, group: styleGroup } = categoryStyleOf(
                group.category.slug,
              );
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={clsx("related-tile", "related-tile--group", {
                      "related-tile--active": key === selectedKey,
                    })}
                    data-group={styleGroup}
                    aria-pressed={key === selectedKey}
                    onClick={() => setSelectedKey(key)}
                  >
                    <span className="category-icon category-icon--tile">
                      <Icon
                        className="category-icon__glyph"
                        aria-hidden="true"
                      />
                      <span className="category-icon__count">
                        {group.category.heroes.length}
                      </span>
                    </span>
                    <span className="related-tile__name">
                      {group.category.name}
                    </span>
                    <span className="related-tile__kind">
                      {CATEGORY_GROUP_LABELS[styleGroup]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {heroes.length > 0 && (
        <div className="related-heroes__section">
          {groups.length > 0 && (
            <span className="related-heroes__label">Heroes</span>
          )}
          <ul className="related-heroes__tiles">
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
        </div>
      )}
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
