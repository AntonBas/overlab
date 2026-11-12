package gg.overlab.backend.stats;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.HexFormat;
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
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(joined.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
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
