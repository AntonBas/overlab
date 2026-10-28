package gg.overlab.backend.stats.dto;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public record StatsSnapshotDto(
        @Schema(description = "When the snapshot was collected from Blizzard") Instant capturedAt,
        @Schema(description = "Game queue: COMPETITIVE has ban rate and ranks, QUICK_PLAY does not") GameQueue queue,
        @Schema(description = "Rank tier filter, always ALL for QUICK_PLAY") RankTier tier,
        @Schema(description = "Map slug, or all-maps for the overall statistics") String map,
        @Schema(description = "Platform the statistics were collected for") Platform platform,
        @Schema(description = "Region the statistics were collected for") Region region,
        @Schema(description = "Statistics of every hero for the selected filters") List<HeroStatDto> heroes) implements Serializable {
}
