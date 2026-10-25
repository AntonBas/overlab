package gg.overlab.backend.stats.dto;

import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public record HeroHistoryDto(
        HeroDto hero,
        GameQueue queue,
        RankTier tier,
        String map,
        Platform platform,
        Region region,
        Instant from,
        Instant to,
        List<HeroHistoryPointDto> points) implements Serializable {
}
