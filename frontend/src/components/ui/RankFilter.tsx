import type { RankTier } from "../../types/api";
import { RANK_OPTIONS } from "../../features/stats/filterOptions";
import { IconSelect } from "./IconSelect";

interface RankFilterProps {
  value: RankTier;
  onChange: (tier: RankTier) => void;
  disabled?: boolean;
  tiers?: readonly RankTier[];
}

export function RankFilter({
  value,
  onChange,
  disabled = false,
  tiers,
}: RankFilterProps) {
  const options = tiers
    ? RANK_OPTIONS.filter((option) => tiers.includes(option.value))
    : RANK_OPTIONS;
  return (
    <IconSelect
      label="Rank"
      value={value}
      options={options}
      disabled={disabled || options.length <= 1}
      onChange={onChange}
    />
  );
}
