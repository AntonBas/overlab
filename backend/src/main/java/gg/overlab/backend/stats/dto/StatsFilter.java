package gg.overlab.backend.stats.dto;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.io.Serializable;

public record StatsFilter(GameQueue queue, RankTier tier, String mapSlug, Platform platform, Region region)
        implements Serializable {

    public static final String ALL_MAPS = "all-maps";

    public static StatsFilter of(GameQueue queue, RankTier tier, String mapSlug, Platform platform, Region region) {
        RankTier effectiveTier = queue == GameQueue.QUICK_PLAY ? RankTier.ALL : tier;
        return new StatsFilter(queue, effectiveTier, mapSlug, platform, region);
    }

    public boolean isAllMaps() {
        return ALL_MAPS.equals(mapSlug);
    }

    public String cacheKey() {
        return String.join(":", queue.name(), tier.name(), mapSlug, platform.name(), region.name());
    }
}
