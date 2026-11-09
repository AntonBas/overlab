package gg.overlab.backend.stats;

import java.math.BigDecimal;
import java.time.Instant;

public record RateRow(Long heroId, BigDecimal winRate, BigDecimal pickRate, BigDecimal banRate, Instant capturedAt) {
}
