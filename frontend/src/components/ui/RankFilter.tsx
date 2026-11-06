import type { RankTier } from "../../types/api";
import { TIERS } from "../../features/stats/filters";
import { TIER_LABELS } from "../../utils/format";
import { AllItemsIcon } from "./AllItemsIcon";
import { IconSelect, type IconSelectOption } from "./IconSelect";

interface RankFilterProps {
  value: RankTier;
  onChange: (tier: RankTier) => void;
}

const RANK_OPTIONS: readonly IconSelectOption<RankTier>[] = TIERS.map(
  (tier) => ({
    value: tier,
    label: TIER_LABELS[tier],
    icon:
      tier === "ALL" ? (
        <AllItemsIcon />
      ) : (
        <img
          className="rank-icon"
          src={`/images/ranks/${tier.toLowerCase()}.webp`}
          alt=""
          width={24}
          height={24}
        />
      ),
  }),
);

export function RankFilter({ value, onChange }: RankFilterProps) {
  return (
    <IconSelect
      label="Rank"
      value={value}
      options={RANK_OPTIONS}
      onChange={onChange}
    />
  );
}
