package gg.overlab.backend.stats.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

public record HeroHistoryPointDto(Instant capturedAt, BigDecimal winRate, BigDecimal pickRate, BigDecimal banRate)
        implements Serializable {
}
