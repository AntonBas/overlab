import { Fragment } from "react";
import { abilityKey, useAbilityIndex } from "../context/abilitiesContext";
import { AbilityChip } from "./AbilityChip";

const ABILITY_TOKEN = /\[\[([a-z0-9-]+)\/([a-z0-9-]+)\]\]/g;

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AbilityText({ text }: { text: string }) {
  const abilities = useAbilityIndex();
  const parts = text.split(ABILITY_TOKEN);

  return (
    <>
      {parts.map((part, index) => {
        if (index % 3 !== 0) {
          return null;
        }
        const heroSlug = parts[index - 2];
        const abilitySlug = parts[index - 1];
        const ability =
          index > 0 && heroSlug && abilitySlug
            ? abilities.get(abilityKey(heroSlug, abilitySlug))
            : undefined;
        return (
          <Fragment key={index}>
            {index > 0 &&
              heroSlug &&
              abilitySlug &&
              (ability ? (
                <AbilityChip ability={ability} />
              ) : (
                <span>{humanize(abilitySlug)}</span>
              ))}
            {part}
          </Fragment>
        );
      })}
    </>
  );
}
