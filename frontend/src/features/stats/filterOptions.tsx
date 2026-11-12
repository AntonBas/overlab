import { Gamepad2, Globe, Monitor, Trophy, Zap } from "lucide-react";
import { AllItemsIcon } from "../../components/ui/AllItemsIcon";
import type { IconSelectOption } from "../../components/ui/IconSelect";
import type { GameQueue, Platform, RankTier, Region } from "../../types/common";
import {
  PLATFORM_LABELS,
  QUEUE_LABELS,
  REGION_LABELS,
  TIER_LABELS,
} from "../../utils/format";
import { PLATFORMS, QUEUES, REGIONS, TIERS } from "./filters";

export const QUEUE_OPTIONS: readonly IconSelectOption<GameQueue>[] = QUEUES.map(
  (queue) => ({
    value: queue,
    label: QUEUE_LABELS[queue],
    icon:
      queue === "COMPETITIVE" ? (
        <Trophy aria-hidden="true" size={18} />
      ) : (
        <Zap aria-hidden="true" size={18} />
      ),
  }),
);

export const PLATFORM_OPTIONS: readonly IconSelectOption<Platform>[] =
  PLATFORMS.map((platform) => ({
    value: platform,
    label: PLATFORM_LABELS[platform],
    icon:
      platform === "PC" ? (
        <Monitor aria-hidden="true" size={18} />
      ) : (
        <Gamepad2 aria-hidden="true" size={18} />
      ),
  }));

export const REGION_OPTIONS: readonly IconSelectOption<Region>[] = REGIONS.map(
  (region) => ({
    value: region,
    label: REGION_LABELS[region],
    icon: <Globe aria-hidden="true" size={18} />,
  }),
);

export const RANK_OPTIONS: readonly IconSelectOption<RankTier>[] = TIERS.map(
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
