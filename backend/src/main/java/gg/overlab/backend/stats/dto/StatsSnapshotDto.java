package gg.overlab.backend.stats.dto;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public record StatsSnapshotDto(
        Instant capturedAt,
        GameQueue queue,
        RankTier tier,
        String map,
        Platform platform,
        Region region,
        List<HeroStatDto> heroes) implements Serializable {
}
