import type { RankTier } from "../../types/api";
import { RANK_OPTIONS } from "../../features/stats/filterOptions";
import { IconSelect } from "./IconSelect";

interface RankFilterProps {
  value: RankTier;
  onChange: (tier: RankTier) => void;
  disabled?: boolean;
}

export function RankFilter({
  value,
  onChange,
  disabled = false,
}: RankFilterProps) {
  return (
    <IconSelect
      label="Rank"
      value={value}
      options={RANK_OPTIONS}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
