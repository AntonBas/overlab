package gg.overlab.backend.stats.dto;

import gg.overlab.backend.hero.HeroRole;
import java.io.Serializable;
import java.math.BigDecimal;

public record HeroStatDto(
        String heroSlug,
        String heroName,
        HeroRole role,
        String subrole,
        BigDecimal winRate,
        BigDecimal pickRate,
        BigDecimal banRate,
        BigDecimal winRateDelta,
        BigDecimal pickRateDelta,
        BigDecimal banRateDelta) implements Serializable {
}
