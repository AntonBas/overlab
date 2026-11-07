package gg.overlab.backend.stats.dto;

import gg.overlab.backend.hero.HeroRole;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.math.BigDecimal;

public record HeroChangeDto(
        @Schema(description = "Hero slug") String heroSlug,
        @Schema(description = "Hero display name") String heroName,
        @Schema(description = "Hero role") HeroRole role,
        @Schema(description = "Win rate before. Percent, 0-100") BigDecimal winRateBefore,
        @Schema(description = "Win rate after. Percent, 0-100") BigDecimal winRateAfter,
        @Schema(description = "Win rate after minus before, in percentage points") BigDecimal winRateChange,
        @Schema(description = "Pick rate before. Percent, 0-100") BigDecimal pickRateBefore,
        @Schema(description = "Pick rate after. Percent, 0-100") BigDecimal pickRateAfter,
        @Schema(description = "Pick rate after minus before, in percentage points") BigDecimal pickRateChange,
        @Schema(description = "Ban rate before. Percent, 0-100") BigDecimal banRateBefore,
        @Schema(description = "Ban rate after. Percent, 0-100") BigDecimal banRateAfter,
        @Schema(description = "Ban rate after minus before, in percentage points") BigDecimal banRateChange,
        String portraitUrl,
        @Schema(description = "Role change that happened between the two snapshots, null if none")
        HeroRoleChangeDto roleChange) implements Serializable {
}
