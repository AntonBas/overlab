package gg.overlab.backend.stats;

import gg.overlab.backend.stats.dto.HeroStatDto;
import java.math.BigDecimal;
import java.util.Comparator;

public enum StatsSort {
    PICK_RATE(Comparator.comparing(HeroStatDto::pickRate, Comparator.nullsFirst(Comparator.<BigDecimal>naturalOrder()))),
    WIN_RATE(Comparator.comparing(HeroStatDto::winRate, Comparator.nullsFirst(Comparator.<BigDecimal>naturalOrder()))),
    BAN_RATE(Comparator.comparing(HeroStatDto::banRate, Comparator.nullsFirst(Comparator.<BigDecimal>naturalOrder()))),
    NAME(Comparator.comparing(HeroStatDto::heroName, String.CASE_INSENSITIVE_ORDER));

    private final Comparator<HeroStatDto> comparator;

    StatsSort(Comparator<HeroStatDto> comparator) {
        this.comparator = comparator;
    }

    public Comparator<HeroStatDto> comparator(boolean descending) {
        return descending ? comparator.reversed() : comparator;
    }
}
