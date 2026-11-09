const FIRE_LABEL = /(^|[.!?]\s+)(primary|secondary) fire\s+(?=[A-Z])/gi;
const SHOUTING_FIRE = /\b(PRIMARY|SECONDARY) FIRE\b/g;

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatAbilityDescription(description: string): string {
  return description
    .replace(
      FIRE_LABEL,
      (_match, prefix: string, kind: string) =>
        `${prefix}${capitalize(kind)} fire: `,
    )
    .replace(SHOUTING_FIRE, (match) => match.toLowerCase());
}
