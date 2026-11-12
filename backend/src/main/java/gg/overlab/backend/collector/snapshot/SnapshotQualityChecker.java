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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SnapshotQualityChecker {

    private static final BigDecimal MAX_WIN_RATE_JUMP = new BigDecimal("5");
    private static final BigDecimal MAX_PICK_RATE_JUMP = new BigDecimal("8");
    private static final BigDecimal PICK_RATE_SUM_TOLERANCE = new BigDecimal("0.03");
    private static final BigDecimal FIVE_VS_FIVE_PICK_RATE_SUM = new BigDecimal("500");
    private static final BigDecimal SIX_VS_SIX_PICK_RATE_SUM = new BigDecimal("600");

    private final HeroStatRepository heroStatRepository;
    private final CollectorMetrics metrics;

    public void inspect(Instant capturedAt, GameQueue queue, GameFormat gameFormat, Platform platform, Region region,
                        RankTier tier, String mapSlug, List<BlizzardRatesResponse.HeroRate> rates) {
        checkPickRateSum(queue, gameFormat, tier, mapSlug, rates);
        List<HeroStat> previous = RatesSnapshotWriter.ALL_MAPS.equals(mapSlug)
                ? heroStatRepository.findPreviousForAllMaps(queue, gameFormat, platform, region, tier, capturedAt)
                : heroStatRepository.findPreviousForMap(mapSlug, queue, gameFormat, platform, region, tier,
                        capturedAt);
        checkOutliers(queue, tier, mapSlug, rates, previous);
    }

    private void checkPickRateSum(GameQueue queue, GameFormat gameFormat, RankTier tier, String mapSlug,
                                  List<BlizzardRatesResponse.HeroRate> rates) {
        BigDecimal expected = gameFormat == GameFormat.SIX_VS_SIX
                ? SIX_VS_SIX_PICK_RATE_SUM : FIVE_VS_FIVE_PICK_RATE_SUM;
        BigDecimal actual = rates.stream()
                .map(rate -> rate.cells().pickrate())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (actual.subtract(expected).abs().compareTo(expected.multiply(PICK_RATE_SUM_TOLERANCE)) > 0) {
            metrics.recordSuspiciousSnapshot("pick_rate_sum");
            log.warn("Suspicious snapshot {}/{}/{}: pick rates sum to {} instead of about {}", queue, tier, mapSlug,
                    actual, expected);
        }
    }

    private void checkOutliers(GameQueue queue, RankTier tier, String mapSlug,
                               List<BlizzardRatesResponse.HeroRate> rates, List<HeroStat> previous) {
        if (previous.isEmpty()) {
            return;
        }
        Map<String, HeroStat> previousBySlug = previous.stream()
                .collect(Collectors.toMap(stat -> stat.getHero().getSlug(), Function.identity(), (first, second) -> first));
        int outliers = 0;
        for (BlizzardRatesResponse.HeroRate rate : rates) {
            HeroStat before = previousBySlug.get(rate.id());
            if (before == null) {
                continue;
            }
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
    }

    private boolean jumped(BigDecimal current, BigDecimal before, BigDecimal limit) {
        return current.subtract(before).abs().compareTo(limit) > 0;
    }
}
