package gg.overlab.backend.stats.dto;

import gg.overlab.backend.gamemap.MapMode;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record HeroMapStatDto(
        String mapSlug,
        String mapName,
        MapMode mode,
        BigDecimal winRate,
        BigDecimal pickRate,
        BigDecimal banRate,
        BigDecimal winRateDelta,
        BigDecimal pickRateDelta,
        Instant capturedAt) implements Serializable {
}
