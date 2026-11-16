package gg.overlab.backend.collector.snapshot;

import gg.overlab.backend.collector.CollectorMetrics;
import gg.overlab.backend.collector.client.BlizzardRatesResponse;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.HeroStat;
import gg.overlab.backend.stats.HeroStatRepository;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Inspects every snapshot before it is stored.
 *
 * <p>Pick rates should add up to 100% of the players in the game format (500 for 5v5, 600 for 6v6). A sum that is off
 * by more than 3% is logged and counted; a sum that is off by more than 10% (real data has stayed within 3.5%) is
 * quarantined. The sum is judged only for responses with at least 10 heroes. A sum that stays wrong keeps being
 * quarantined, because it means broken data or a game format that no longer matches the configuration.
 *
 * <p>When at least half of the heroes jumped by more than 5 points in win rate or 8 points in pick rate since the
 * previous snapshot, the snapshot is quarantined too, and it is stored only if Blizzard returns the same numbers on
 * the next run (a real change, for example after a large patch). Single heroes that jump are only logged and counted.
 *
 * <p>A quarantined snapshot is not stored: the request is recorded as rejected in the run history, the log and the
 * metrics, and the previous numbers stay on the site.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SnapshotQualityChecker {

    private static final BigDecimal MAX_WIN_RATE_JUMP = new BigDecimal("5");
    private static final BigDecimal MAX_PICK_RATE_JUMP = new BigDecimal("8");
    private static final BigDecimal PICK_RATE_SUM_TOLERANCE = new BigDecimal("0.03");
    private static final BigDecimal PICK_RATE_SUM_QUARANTINE_TOLERANCE = new BigDecimal("0.10");
    private static final BigDecimal FIVE_VS_FIVE_PICK_RATE_SUM = new BigDecimal("500");
    private static final BigDecimal SIX_VS_SIX_PICK_RATE_SUM = new BigDecimal("600");
    private static final int MIN_HEROES_FOR_MASS_JUMP = 10;
    private static final int MIN_HEROES_FOR_PICK_RATE_SUM = 10;
    private static final double MASS_JUMP_SHARE = 0.5;

    private final HeroStatRepository heroStatRepository;
    private final CollectorMetrics metrics;
    private final Map<String, String> quarantinedMassJumps = new ConcurrentHashMap<>();

    public void inspect(Instant capturedAt, GameQueue queue, GameFormat gameFormat, Platform platform, Region region,
                        RankTier tier, String mapSlug, List<BlizzardRatesResponse.HeroRate> rates) {
        checkPickRateSum(queue, gameFormat, tier, mapSlug, rates);
        List<HeroStat> previous = StatsFilter.ALL_MAPS.equals(mapSlug)
                ? heroStatRepository.findPreviousForAllMaps(queue, gameFormat, platform, region, tier, capturedAt)
                : heroStatRepository.findPreviousForMap(mapSlug, queue, gameFormat, platform, region, tier,
                        capturedAt);
        String combination = queue + "/" + platform + "/" + region + "/" + tier + "/" + mapSlug;
        checkOutliers(combination, queue, tier, mapSlug, rates, previous);
    }

    private void checkPickRateSum(GameQueue queue, GameFormat gameFormat, RankTier tier, String mapSlug,
                                  List<BlizzardRatesResponse.HeroRate> rates) {
        if (rates.size() < MIN_HEROES_FOR_PICK_RATE_SUM) {
            return;
        }
        BigDecimal expected = gameFormat == GameFormat.SIX_VS_SIX
                ? SIX_VS_SIX_PICK_RATE_SUM : FIVE_VS_FIVE_PICK_RATE_SUM;
        BigDecimal actual = rates.stream()
                .map(rate -> rate.cells().pickrate())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deviation = actual.subtract(expected).abs();
        if (deviation.compareTo(expected.multiply(PICK_RATE_SUM_TOLERANCE)) <= 0) {
            return;
        }
        metrics.recordSuspiciousSnapshot("pick_rate_sum");
        if (deviation.compareTo(expected.multiply(PICK_RATE_SUM_QUARANTINE_TOLERANCE)) <= 0) {
            log.warn("Suspicious snapshot {}/{}/{}: pick rates sum to {} instead of about {}", queue, tier, mapSlug,
                    actual, expected);
            return;
        }
        metrics.recordQuarantinedSnapshot("pick_rate_sum");
        log.warn("Quarantined snapshot {}/{}/{}: pick rates sum to {} instead of about {}", queue, tier, mapSlug,
                actual, expected);
        throw new QuarantinedSnapshotException("Quarantined: pick rates sum to " + actual + " instead of about "
                + expected);
    }

    private void checkOutliers(String combination, GameQueue queue, RankTier tier, String mapSlug,
                               List<BlizzardRatesResponse.HeroRate> rates, List<HeroStat> previous) {
        if (previous.isEmpty()) {
            return;
        }
        Map<String, HeroStat> previousBySlug = previous.stream()
                .collect(Collectors.toMap(stat -> stat.getHero().getSlug(), Function.identity(),
                        (first, second) -> first));
        int outliers = 0;
        int compared = 0;
        for (BlizzardRatesResponse.HeroRate rate : rates) {
            HeroStat before = previousBySlug.get(rate.id());
            if (before == null) {
                continue;
            }
            compared++;
            boolean winRateJump = jumped(rate.cells().winrate(), before.getWinRate(), MAX_WIN_RATE_JUMP);
            boolean pickRateJump = jumped(rate.cells().pickrate(), before.getPickRate(), MAX_PICK_RATE_JUMP);
            if (winRateJump || pickRateJump) {
                outliers++;
                log.warn("Outlier {}/{}/{}: {} win rate {} -> {}, pick rate {} -> {}", queue, tier, mapSlug,
                        rate.id(), before.getWinRate(), rate.cells().winrate(), before.getPickRate(),
                        rate.cells().pickrate());
            }
        }
        if (outliers > 0) {
            metrics.recordOutliers(outliers);
        }
        decideMassJump(combination, queue, tier, mapSlug, rates, outliers, compared);
    }

    private void decideMassJump(String combination, GameQueue queue, RankTier tier, String mapSlug,
                                List<BlizzardRatesResponse.HeroRate> rates, int outliers, int compared) {
        if (compared < MIN_HEROES_FOR_MASS_JUMP || outliers < compared * MASS_JUMP_SHARE) {
            quarantinedMassJumps.remove(combination);
            return;
        }
        String signature = SnapshotRecorder.signatureOf(queue, rates);
        if (signature.equals(quarantinedMassJumps.get(combination))) {
            quarantinedMassJumps.remove(combination);
            log.warn("Accepted snapshot {}/{}/{}: {} of {} heroes jumped and Blizzard returned the same numbers "
                    + "again", queue, tier, mapSlug, outliers, compared);
            return;
        }
        quarantinedMassJumps.put(combination, signature);
        metrics.recordQuarantinedSnapshot("mass_jump");
        log.warn("Quarantined snapshot {}/{}/{}: {} of {} heroes jumped since the previous snapshot", queue, tier,
                mapSlug, outliers, compared);
        throw new QuarantinedSnapshotException("Quarantined: " + outliers + " of " + compared
                + " heroes jumped since the previous snapshot; it is stored only if the next run returns the "
                + "same numbers");
    }

    private boolean jumped(BigDecimal current, BigDecimal before, BigDecimal limit) {
        return current.subtract(before).abs().compareTo(limit) > 0;
    }
}
