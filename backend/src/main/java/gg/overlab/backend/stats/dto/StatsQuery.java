package gg.overlab.backend.stats.dto;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatsQuery {

    private GameQueue queue = GameQueue.COMPETITIVE;
    private RankTier tier = RankTier.ALL;
    private String map = StatsFilter.ALL_MAPS;
    private Platform platform = Platform.PC;
    private Region region = Region.EUROPE;

    public StatsFilter filter() {
        return StatsFilter.of(queue, tier, map, platform, region);
    }

    public StatsFilter overallFilter() {
        return StatsFilter.of(queue, tier, StatsFilter.ALL_MAPS, platform, region);
    }
}
