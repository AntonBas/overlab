package gg.overlab.backend.stats.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record HeroHistoryPointDto(
        @Schema(description = "When the snapshot was collected from Blizzard") Instant capturedAt,
        @Schema(description = "Win rate. Percent, 0-100") BigDecimal winRate,
        @Schema(description = "Pick rate. Percent, 0-100") BigDecimal pickRate,
        @Schema(description = "Ban rate. Percent, 0-100. Null for QUICK_PLAY") BigDecimal banRate) implements Serializable {
}
