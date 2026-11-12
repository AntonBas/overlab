package gg.overlab.backend.collector.snapshot;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.CollectorFixtures;
import gg.overlab.backend.collector.CollectorMetrics;
import gg.overlab.backend.collector.client.BlizzardRatesResponse;
import gg.overlab.backend.hero.Hero;
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
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class SnapshotQualityCheckerTest {

    private final HeroStatRepository repository = mock(HeroStatRepository.class);
    private final CollectorMetrics metrics = mock(CollectorMetrics.class);
    private final SnapshotQualityChecker checker = new SnapshotQualityChecker(repository, metrics);
    private final Instant now = Instant.now();

    @Test
    void acceptsPickRatesSummingToFiveSlots() {
        when(repository.findPreviousForAllMaps(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        inspect(ratesSummingTo("500"));

        verify(metrics, never()).recordSuspiciousSnapshot(any());
    }

    @Test
    void flagsPickRatesFarFromExpectedSum() {
        when(repository.findPreviousForAllMaps(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        inspect(ratesSummingTo("320"));

        verify(metrics).recordSuspiciousSnapshot("pick_rate_sum");
    }

    @Test
    void countsHeroesWhoseRatesJumpedBetweenSnapshots() {
        when(repository.findPreviousForAllMaps(any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(previous("hero-0", "50.0", "10.0"), previous("hero-1", "50.0", "10.0")));
        List<BlizzardRatesResponse.HeroRate> rates = new ArrayList<>(ratesSummingTo("500"));
        rates.set(0, CollectorFixtures.rate("hero-0", "TANK", "58.0", "10.0", null));
        rates.set(1, CollectorFixtures.rate("hero-1", "TANK", "50.5", "10.5", null));

        inspect(rates);

        verify(metrics).recordOutliers(eq(1));
    }

    @Test
    void ignoresHeroesWithoutPreviousSnapshot() {
        when(repository.findPreviousForAllMaps(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        inspect(ratesSummingTo("500"));

        verify(metrics, never()).recordOutliers(any(Integer.class));
    }

    private void inspect(List<BlizzardRatesResponse.HeroRate> rates) {
        checker.inspect(now, GameQueue.COMPETITIVE, GameFormat.FIVE_VS_FIVE, Platform.PC, Region.EUROPE,
                RankTier.ALL, StatsFilter.ALL_MAPS, rates);
    }

    private List<BlizzardRatesResponse.HeroRate> ratesSummingTo(String total) {
        int count = 50;
        BigDecimal each = new BigDecimal(total).divide(BigDecimal.valueOf(count));
        List<BlizzardRatesResponse.HeroRate> rates = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            rates.add(CollectorFixtures.rate("hero-" + index, "TANK", "50.0", each.toPlainString(), null));
        }
        return rates;
    }

    private HeroStat previous(String slug, String win, String pick) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setWinRate(new BigDecimal(win));
        stat.setPickRate(new BigDecimal(pick));
        return stat;
    }
}
