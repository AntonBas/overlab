package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.HeroStat;
import gg.overlab.backend.stats.HeroStatRepository;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.SnapshotCheck;
import gg.overlab.backend.stats.SnapshotCheckRepository;
import gg.overlab.backend.stats.StatsFreshnessService;
import gg.overlab.backend.stats.StatsHistoryService;
import gg.overlab.backend.stats.dto.DataFreshnessDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class StatsFreshnessIntegrationTest {

    private static final Instant FIRST = Instant.parse("2026-10-01T04:00:00Z");
    private static final Instant SECOND = Instant.parse("2026-10-02T04:00:00Z");
    private static final Instant THIRD = Instant.parse("2026-10-03T04:00:00Z");
    private static final Instant FOURTH = Instant.parse("2026-10-04T04:00:00Z");

    @Autowired
    private StatsFreshnessService freshnessService;

    @Autowired
    private StatsHistoryService historyService;

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private HeroStatRepository heroStatRepository;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private SnapshotCheckRepository snapshotCheckRepository;

    private Hero ana;
    private Hero genji;

    @BeforeEach
    void setUp() {
        cacheManager.getCacheNames().forEach(name -> cacheManager.getCache(name).clear());
        ana = hero("fresh-ana", "Ana");
        genji = hero("fresh-genji", "Genji");
    }

    private StatsFilter filter() {
        return StatsFilter.of(GameQueue.QUICK_PLAY, RankTier.ALL, StatsFilter.ALL_MAPS, Platform.CONSOLE,
                Region.ASIA);
    }

    @Test
    void reportsWhenTheCurrentNumbersFirstAppeared() {
        snapshot(FIRST, "47.00", "52.00");
        snapshot(SECOND, "47.00", "52.00");
        snapshot(THIRD, "48.00", "52.00");
        snapshot(FOURTH, "48.00", "52.00");

        DataFreshnessDto freshness = freshnessService.freshness(filter());

        assertThat(freshness.capturedAt()).isEqualTo(FOURTH);
        assertThat(freshness.valuesSince()).isEqualTo(THIRD);
        assertThat(freshness.changeObserved()).isTrue();
        assertThat(freshness.snapshotCount()).isEqualTo(4);
    }

    @Test
    void saysTheNumbersNeverChangedWhenEverySnapshotMatches() {
        snapshot(FIRST, "47.00", "52.00");
        snapshot(SECOND, "47.00", "52.00");
        snapshot(THIRD, "47.00", "52.00");

        DataFreshnessDto freshness = freshnessService.freshness(filter());

        assertThat(freshness.valuesSince()).isEqualTo(FIRST);
        assertThat(freshness.changeObserved()).isFalse();
    }

    @Test
    void aChangeInOneHeroCountsAsAChange() {
        snapshot(FIRST, "47.00", "52.00");
        snapshot(SECOND, "47.00", "52.50");

        DataFreshnessDto freshness = freshnessService.freshness(filter());

        assertThat(freshness.valuesSince()).isEqualTo(SECOND);
        assertThat(freshness.changeObserved()).isTrue();
    }

    @Test
    void trailingZerosDoNotCountAsAChange() {
        snapshot(FIRST, "47.0", "52.0");
        snapshot(SECOND, "47.00", "52.00");

        assertThat(freshnessService.freshness(filter()).changeObserved()).isFalse();
    }

    @Test
    void reportsWhenTheNumbersWereLastCheckedEvenIfNothingWasStored() {
        snapshot(FIRST, "47.00", "52.00");
        SnapshotCheck check = new SnapshotCheck();
        check.setQueue(GameQueue.QUICK_PLAY);
        check.setPlatform(Platform.CONSOLE);
        check.setRegion(Region.ASIA);
        check.setTier(RankTier.ALL);
        check.setMapKey("all-maps");
        check.setSignature("test");
        check.setLastChangedAt(FIRST);
        check.setLastCheckedAt(FOURTH);
        snapshotCheckRepository.saveAndFlush(check);

        DataFreshnessDto freshness = freshnessService.freshness(filter());

        assertThat(freshness.capturedAt()).isEqualTo(FIRST);
        assertThat(freshness.lastCheckedAt()).isEqualTo(FOURTH);
    }

    @Test
    void aSingleSnapshotHasNothingToCompare() {
        snapshot(FIRST, "47.00", "52.00");

        DataFreshnessDto freshness = freshnessService.freshness(filter());

        assertThat(freshness.snapshotCount()).isEqualTo(1);
        assertThat(freshness.changeObserved()).isFalse();
    }

    @Test
    void historyStartsWithTheFirstStoredSnapshot() {
        snapshot(SECOND, "47.00", "52.00");
        snapshot(FIRST, "47.00", "52.00");

        assertThat(historyService.historyStart(filter()).firstCapturedAt()).isEqualTo(FIRST);
    }

    @Test
    void historyStartIsEmptyWithoutSnapshots() {
        assertThat(historyService.historyStart(filter()).firstCapturedAt()).isNull();
    }

    @Test
    void noSnapshotsMeansNoStatistics() {
        StatsFilter other = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.GRANDMASTER, StatsFilter.ALL_MAPS,
                Platform.CONSOLE, Region.AMERICAS);

        assertThatThrownBy(() -> freshnessService.freshness(other)).isInstanceOf(EntityNotFoundException.class);
    }

    private void snapshot(Instant capturedAt, String anaWinRate, String genjiWinRate) {
        heroStatRepository.save(stat(ana, capturedAt, anaWinRate));
        heroStatRepository.saveAndFlush(stat(genji, capturedAt, genjiWinRate));
    }

    private HeroStat stat(Hero hero, Instant capturedAt, String winRate) {
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setQueue(GameQueue.QUICK_PLAY);
        stat.setGameFormat(GameFormat.FIVE_VS_FIVE);
        stat.setPlatform(Platform.CONSOLE);
        stat.setRegion(Region.ASIA);
        stat.setTier(RankTier.ALL);
        stat.setWinRate(new BigDecimal(winRate));
        stat.setPickRate(new BigDecimal("10.00"));
        stat.setCapturedAt(capturedAt);
        return stat;
    }

    private Hero hero(String slug, String name) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        hero.setName(name);
        hero.setRole(HeroRole.SUPPORT);
        return heroRepository.save(hero);
    }
}
