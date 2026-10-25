package gg.overlab.backend.stats.dto;

import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.io.Serializable;
import java.util.List;

public record HeroMapStatsDto(
        HeroDto hero,
        GameQueue queue,
        RankTier tier,
        Platform platform,
        Region region,
        HeroMapStatDto overall,
        List<HeroMapStatDto> maps) implements Serializable {
}
