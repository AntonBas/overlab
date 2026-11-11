package gg.overlab.backend.stats.dto;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.util.List;

public record CoverageDto(
        GameQueue queue,
        Platform platform,
        Region region,
        @Schema(description = "Ranks collected for all maps combined") List<RankTier> tiers,
        @Schema(description = "Ranks collected for individual maps") List<RankTier> mapTiers)
        implements Serializable {
}
