package gg.overlab.backend.stats.dto;

import gg.overlab.backend.hero.HeroRole;
import java.io.Serializable;
import java.math.BigDecimal;

public record HeroChangeDto(
        String heroSlug,
        String heroName,
        HeroRole role,
        BigDecimal winRateBefore,
        BigDecimal winRateAfter,
        BigDecimal winRateChange,
        BigDecimal pickRateBefore,
        BigDecimal pickRateAfter,
        BigDecimal pickRateChange,
        BigDecimal banRateBefore,
        BigDecimal banRateAfter,
        BigDecimal banRateChange) implements Serializable {
}
