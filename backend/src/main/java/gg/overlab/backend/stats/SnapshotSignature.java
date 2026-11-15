package gg.overlab.backend.stats;

import gg.overlab.backend.common.Sha256;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public final class SnapshotSignature {

    private SnapshotSignature() {
    }

    public record Entry(String heroSlug, BigDecimal winRate, BigDecimal pickRate, BigDecimal banRate) {
    }

    public static String of(List<Entry> entries) {
        String joined = entries.stream()
                .sorted(Comparator.comparing(Entry::heroSlug))
                .map(entry -> entry.heroSlug() + ":" + plain(entry.winRate()) + ":" + plain(entry.pickRate()) + ":"
                        + plain(entry.banRate()))
                .collect(Collectors.joining(","));
        return Sha256.hex(joined);
    }

    public static String ofStats(List<HeroStat> stats) {
        return of(stats.stream()
                .map(stat -> new Entry(stat.getHero().getSlug(), stat.getWinRate(), stat.getPickRate(),
                        stat.getBanRate()))
                .toList());
    }

    static String plain(BigDecimal value) {
        return value == null ? "-" : value.stripTrailingZeros().toPlainString();
    }
}
