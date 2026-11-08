import { formatPercent } from "../../../../utils/format";

interface StatChipsProps {
  winRate: number;
  pickRate: number;
  banRate: number | null;
  showBan: boolean;
}

interface Chip {
  tone: "win" | "pick" | "ban";
  label: string;
  title: string;
  value: number;
}

export function StatChips({
  winRate,
  pickRate,
  banRate,
  showBan,
}: StatChipsProps) {
  const chips: Chip[] = [
    { tone: "win", label: "Win", title: "Win rate", value: winRate },
    { tone: "pick", label: "Pick", title: "Pick rate", value: pickRate },
  ];
  const hasBan = showBan && banRate !== null;
  if (hasBan) {
    chips.push({
      tone: "ban",
      label: "Ban",
      title: "Ban rate",
      value: banRate,
    });
  }
  return (
    <span className="stat-chips">
      {chips.map((chip) => (
        <span
          key={chip.tone}
          className={`stat-chip stat-chip--${chip.tone}`}
          title={`${chip.title}, all ranks`}
        >
          <span className="visually-hidden">{chip.title} </span>
          <span aria-hidden="true">{chip.label}</span>{" "}
          <strong>{formatPercent(chip.value)}</strong>
        </span>
      ))}
      {!showBan && (
        <span
          className="stat-chip stat-chip--ban stat-chip--reserved"
          aria-hidden="true"
        >
          Ban <strong>00.0%</strong>
        </span>
      )}
    </span>
  );
}
