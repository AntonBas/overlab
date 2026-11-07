package gg.overlab.backend.stats.dto;

import gg.overlab.backend.hero.HeroRole;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.math.BigDecimal;

public record HeroStatDto(
        @Schema(description = "Hero slug") String heroSlug,
        @Schema(description = "Hero display name") String heroName,
        @Schema(description = "Hero role") HeroRole role,
        @Schema(description = "Hero subrole within its role") String subrole,
        @Schema(description = "Win rate. Percent, 0-100") BigDecimal winRate,
        @Schema(description = "Pick rate. Percent, 0-100") BigDecimal pickRate,
        @Schema(description = "Ban rate. Percent, 0-100. Null for QUICK_PLAY") BigDecimal banRate,
        @Schema(description = "Win rate minus the all-maps win rate, in percentage points. Null when the all-maps view is requested") BigDecimal winRateDelta,
        @Schema(description = "Pick rate minus the all-maps pick rate, in percentage points. Null when the all-maps view is requested") BigDecimal pickRateDelta,
        @Schema(description = "Ban rate minus the all-maps ban rate, in percentage points. Null when the all-maps view is requested") BigDecimal banRateDelta,
        @Schema(description = "Hero portrait URL, null when there is no image") String portraitUrl,
        @Schema(description = "True for about two weeks after the hero first appeared") boolean recentlyAdded) implements Serializable {
}
