package gg.overlab.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.stats.dto.StatsFilter;
import org.junit.jupiter.api.Test;

class StatsFilterTest {

    @Test
    void quickPlayIgnoresRequestedTier() {
        StatsFilter filter = StatsFilter.of(GameQueue.QUICK_PLAY, RankTier.GOLD, "all-maps", Platform.PC, Region.EUROPE);

        assertThat(filter.tier()).isEqualTo(RankTier.ALL);
    }

    @Test
    void competitiveKeepsRequestedTier() {
        StatsFilter filter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.GOLD, "all-maps", Platform.PC, Region.EUROPE);

        assertThat(filter.tier()).isEqualTo(RankTier.GOLD);
    }

    @Test
    void cacheKeyContainsEveryFilter() {
        StatsFilter filter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.GOLD, "rialto", Platform.PC, Region.ASIA);

        assertThat(filter.cacheKey()).isEqualTo("COMPETITIVE:GOLD:rialto:PC:ASIA");
    }

    @Test
    void recognizesAllMapsSlug() {
        assertThat(StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "all-maps", Platform.PC, Region.EUROPE).isAllMaps())
                .isTrue();
        assertThat(StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "rialto", Platform.PC, Region.EUROPE).isAllMaps())
                .isFalse();
    }
}
