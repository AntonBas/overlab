package gg.overlab.backend.stats.dto;

import gg.overlab.backend.gamemap.MapMode;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record HeroMapStatDto(
        @Schema(description = "Map slug") String mapSlug,
        @Schema(description = "Map display name") String mapName,
        @Schema(description = "Game mode of the map") MapMode mode,
        @Schema(description = "Win rate. Percent, 0-100") BigDecimal winRate,
        @Schema(description = "Pick rate. Percent, 0-100") BigDecimal pickRate,
        @Schema(description = "Ban rate. Percent, 0-100. Null for QUICK_PLAY") BigDecimal banRate,
        @Schema(description = "Win rate on this map minus the hero's overall win rate, in percentage points") BigDecimal winRateDelta,
        @Schema(description = "Pick rate on this map minus the hero's overall pick rate, in percentage points") BigDecimal pickRateDelta,
        @Schema(description = "When the snapshot was collected from Blizzard") Instant capturedAt) implements Serializable {
}
