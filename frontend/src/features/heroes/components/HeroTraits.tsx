import { AbilityText } from "../../abilities";

interface HeroTraitsProps {
  strengths: string | null;
  weaknesses: string | null;
}

function toPoints(text: string | null): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function TraitList({
  title,
  points,
  modifier,
}: {
  title: string;
  points: string[];
  modifier: string;
}) {
  return (
    <div className={`hero-traits__column hero-traits__column--${modifier}`}>
      <h2>{title}</h2>
      <ul>
        {points.map((point) => (
          <li key={point}>
            <AbilityText text={point} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HeroTraits({ strengths, weaknesses }: HeroTraitsProps) {
  const strengthPoints = toPoints(strengths);
  const weaknessPoints = toPoints(weaknesses);
  if (strengthPoints.length + weaknessPoints.length === 0) {
    return null;
  }
  return (
    <section className="section hero-traits">
      {strengthPoints.length > 0 && (
        <TraitList
          title="Strengths"
          points={strengthPoints}
          modifier="strong"
        />
      )}
      {weaknessPoints.length > 0 && (
        <TraitList title="Weaknesses" points={weaknessPoints} modifier="weak" />
      )}
    </section>
  );
}
