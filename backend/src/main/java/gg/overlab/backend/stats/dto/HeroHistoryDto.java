package gg.overlab.backend.stats.dto;

import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.time.Instant;
import java.util.List;

public record HeroHistoryDto(
        @Schema(description = "Hero these statistics belong to") HeroDto hero,
        @Schema(description = "Game queue: COMPETITIVE has ban rate and ranks, QUICK_PLAY does not") GameQueue queue,
        @Schema(description = "Rank tier filter, always ALL for QUICK_PLAY") RankTier tier,
        @Schema(description = "Map slug, or all-maps for the overall statistics") String map,
        @Schema(description = "Platform the statistics were collected for") Platform platform,
        @Schema(description = "Region the statistics were collected for") Region region,
        @Schema(description = "Start of the requested period") Instant from,
        @Schema(description = "End of the requested period") Instant to,
        @Schema(description = "One point per collected snapshot, oldest first") List<HeroHistoryPointDto> points) implements Serializable {
}
