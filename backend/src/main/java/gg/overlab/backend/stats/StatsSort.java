package gg.overlab.backend.stats;

import gg.overlab.backend.stats.dto.HeroStatDto;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.function.Function;

public enum StatsSort {
    PICK_RATE(byRate(HeroStatDto::pickRate)),
    WIN_RATE(byRate(HeroStatDto::winRate)),
    BAN_RATE(byRate(HeroStatDto::banRate)),
    NAME(Comparator.comparing(HeroStatDto::heroName, String.CASE_INSENSITIVE_ORDER));

    private final Comparator<HeroStatDto> comparator;

    StatsSort(Comparator<HeroStatDto> comparator) {
        this.comparator = comparator;
    }

    private static Comparator<HeroStatDto> byRate(Function<HeroStatDto, BigDecimal> rate) {
        return Comparator.comparing(rate, Comparator.nullsFirst(Comparator.<BigDecimal>naturalOrder()));
    }

    public Comparator<HeroStatDto> comparator(boolean descending) {
        return descending ? comparator.reversed() : comparator;
    }
}
