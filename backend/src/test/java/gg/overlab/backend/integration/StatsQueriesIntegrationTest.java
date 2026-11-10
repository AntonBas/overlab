package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.HeroRoleChange;
import gg.overlab.backend.hero.HeroRoleChangeRepository;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.HeroStat;
import gg.overlab.backend.stats.HeroStatRepository;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.SnapshotCheck;
import gg.overlab.backend.stats.SnapshotCheckRepository;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.patch.Patch;
import gg.overlab.backend.patch.PatchRepository;
import gg.overlab.backend.stats.StatsHistoryService;
import gg.overlab.backend.stats.StatsSnapshotProvider;
import gg.overlab.backend.stats.StatsService;
import gg.overlab.backend.stats.StatsSort;
import gg.overlab.backend.stats.dto.HeroChangeDto;
import gg.overlab.backend.stats.dto.HeroHistoryDto;
import gg.overlab.backend.stats.dto.HeroMapStatsDto;
import gg.overlab.backend.stats.dto.StatsComparisonDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class StatsQueriesIntegrationTest {

    private static final Instant OLD = Instant.parse("2026-10-01T04:00:00Z");
    private static final Instant NEW = Instant.parse("2026-10-08T04:00:00Z");

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private GameMapRepository gameMapRepository;

    @Autowired
    private HeroStatRepository heroStatRepository;

    @Autowired
    private StatsService statsService;

    @Autowired
    private StatsHistoryService historyService;

    @Autowired
    private PatchRepository patchRepository;

    @Autowired
    private HeroRoleChangeRepository roleChangeRepository;

    @Autowired
    private SnapshotCheckRepository snapshotCheckRepository;

    @Autowired
    private CacheManager cacheManager;

    private Hero ana;
    private Hero genji;
    private GameMap rialto;

    @BeforeEach
    void setUp() {
        clearCaches();
        ana = hero("ana-test", "Ana", HeroRole.SUPPORT);
        genji = hero("genji-test", "Genji", HeroRole.DAMAGE);
        rialto = gameMapRepository.findBySlug("rialto").orElseThrow();

        heroStatRepository.saveAll(List.of(
                stat(ana, null, RankTier.ALL, OLD, "40.00", "10.00"),
                stat(genji, null, RankTier.ALL, OLD, "41.00", "11.00"),
                stat(ana, null, RankTier.ALL, NEW, "47.00", "23.00"),
                stat(genji, null, RankTier.ALL, NEW, "55.00", "15.00"),
                stat(ana, rialto, RankTier.ALL, OLD, "30.00", "5.00"),
                stat(ana, rialto, RankTier.ALL, NEW, "48.00", "26.00"),
                stat(ana, null, RankTier.GOLD, NEW, "46.00", "24.00")));
        heroStatRepository.flush();
    }

    @AfterEach
    void tearDown() {
        clearCaches();
    }

    private void clearCaches() {
        cacheManager.getCache(StatsSnapshotProvider.CACHE_NAME).clear();
        cacheManager.getCacheNames().forEach(name -> cacheManager.getCache(name).clear());
    }

    @Test
    void allMapsQueryReturnsOnlyTheNewestSnapshotOfThatCombination() {
        List<HeroStat> stats = heroStatRepository.findLatestForAllMaps(GameQueue.COMPETITIVE, Platform.PC,
                Region.EUROPE, RankTier.ALL);

        assertThat(stats).hasSize(2).allMatch(stat -> stat.getCapturedAt().equals(NEW));
        assertThat(stats).extracting(stat -> stat.getHero().getSlug()).containsExactlyInAnyOrder("ana-test", "genji-test");
    }

    @Test
    void differentTierIsASeparateSnapshot() {
        List<HeroStat> stats = heroStatRepository.findLatestForAllMaps(GameQueue.COMPETITIVE, Platform.PC,
                Region.EUROPE, RankTier.GOLD);

        assertThat(stats).hasSize(1);
        assertThat(stats.get(0).getWinRate()).isEqualByComparingTo("46.00");
    }

    @Test
    void mapQueryReturnsTheNewestSnapshotOfThatMapOnly() {
        List<HeroStat> stats = heroStatRepository.findLatestForMap("rialto", GameQueue.COMPETITIVE, Platform.PC,
                Region.EUROPE, RankTier.ALL);

        assertThat(stats).hasSize(1);
        assertThat(stats.get(0).getCapturedAt()).isEqualTo(NEW);
        assertThat(stats.get(0).getMap().getSlug()).isEqualTo("rialto");
    }

    @Test
    void unknownCombinationIsEmpty() {
        assertThat(heroStatRepository.findLatestForAllMaps(GameQueue.QUICK_PLAY, Platform.PC, Region.EUROPE,
                RankTier.ALL)).isEmpty();
        assertThat(heroStatRepository.findLatestForMap("busan", GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE,
                RankTier.ALL)).isEmpty();
    }

    @Test
    void heroQueryReturnsLatestRowPerMapIncludingTheOverallRow() {
        List<HeroStat> stats = heroStatRepository.findLatestForHero("ana-test", GameQueue.COMPETITIVE, Platform.PC,
                Region.EUROPE, RankTier.ALL);

        assertThat(stats).hasSize(2).allMatch(stat -> stat.getCapturedAt().equals(NEW));
        assertThat(stats).anyMatch(stat -> stat.getMap() == null && stat.getWinRate().compareTo(new BigDecimal("47")) == 0);
        assertThat(stats).anyMatch(stat -> stat.getMap() != null && stat.getWinRate().compareTo(new BigDecimal("48")) == 0);
    }

    @Test
    void snapshotServiceComputesDeltasAgainstTheLatestOverallSnapshot() {
        StatsFilter filter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "rialto", Platform.PC, Region.EUROPE);

        StatsSnapshotDto snapshot = statsService.getStats(filter, null, StatsSort.PICK_RATE, true);

        assertThat(snapshot.capturedAt()).isEqualTo(NEW);
        assertThat(snapshot.heroes()).hasSize(1);
        assertThat(snapshot.heroes().get(0).winRateDelta()).isEqualByComparingTo("1.00");
        assertThat(snapshot.heroes().get(0).pickRateDelta()).isEqualByComparingTo("3.00");
    }

    @Test
    void heroServiceBuildsMapRowsWithDeltas() {
        HeroMapStatsDto result = statsService.getHeroByMaps("ana-test", GameQueue.COMPETITIVE, RankTier.ALL,
                Platform.PC, Region.EUROPE);

        assertThat(result.overall().winRate()).isEqualByComparingTo("47.00");
        assertThat(result.maps()).hasSize(1);
        assertThat(result.maps().get(0).mapSlug()).isEqualTo("rialto");
        assertThat(result.maps().get(0).winRateDelta()).isEqualByComparingTo("1.00");
    }

    @Test
    void historyReturnsOverallPointsInChronologicalOrder() {
        HeroHistoryDto history = historyService.getHeroHistory("ana-test", allMaps(), OLD.minus(Duration.ofDays(1)),
                NEW.plus(Duration.ofDays(1)));

        assertThat(history.points()).extracting(point -> point.capturedAt()).containsExactly(OLD, NEW);
        assertThat(history.points().get(0).winRate()).isEqualByComparingTo("40.00");
        assertThat(history.points().get(1).winRate()).isEqualByComparingTo("47.00");
    }

    @Test
    void historyKeepsOnlyTheLatestSnapshotOfEachDay() {
        Instant laterSameDay = NEW.plus(Duration.ofHours(6));
        heroStatRepository.saveAndFlush(stat(ana, null, RankTier.ALL, laterSameDay, "49.00", "24.00"));

        HeroHistoryDto history = historyService.getHeroHistory("ana-test", allMaps(), OLD.minus(Duration.ofDays(1)),
                NEW.plus(Duration.ofDays(1)));

        assertThat(history.points()).extracting(point -> point.capturedAt()).containsExactly(OLD, laterSameDay);
        assertThat(history.points().get(1).winRate()).isEqualByComparingTo("49.00");
    }

    @Test
    void historyContainsOnlySavedSnapshotsEvenWhenLaterChecksFoundNoChange() {
        saveCheck(NEW.plus(Duration.ofDays(3)));

        HeroHistoryDto history = historyService.getHeroHistory("ana-test", allMaps(), OLD.minus(Duration.ofDays(1)),
                NEW.plus(Duration.ofDays(5)));

        assertThat(history.points()).extracting(point -> point.capturedAt()).containsExactly(OLD, NEW);
    }

    @Test
    void theSnapshotShowsWhenTheNumbersWereLastChecked() {
        Instant checked = NEW.plus(Duration.ofDays(2));
        saveCheck(checked);

        assertThat(statsService.getStats(allMaps(), null, StatsSort.PICK_RATE, true).capturedAt())
                .isEqualTo(checked);
    }

    private void saveCheck(Instant checkedAt) {
        SnapshotCheck check = new SnapshotCheck();
        check.setQueue(GameQueue.COMPETITIVE);
        check.setPlatform(Platform.PC);
        check.setRegion(Region.EUROPE);
        check.setTier(RankTier.ALL);
        check.setMapKey("all-maps");
        check.setSignature("test");
        check.setLastChangedAt(NEW);
        check.setLastCheckedAt(checkedAt);
        snapshotCheckRepository.saveAndFlush(check);
    }

    @Test
    void historyForAMapReturnsOnlyThatMap() {
        StatsFilter rialtoFilter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "rialto", Platform.PC,
                Region.EUROPE);

        HeroHistoryDto history = historyService.getHeroHistory("ana-test", rialtoFilter, OLD, NEW);

        assertThat(history.points()).hasSize(2);
        assertThat(history.points().get(1).winRate()).isEqualByComparingTo("48.00");
    }

    @Test
    void historyRespectsTheRequestedRange() {
        HeroHistoryDto history = historyService.getHeroHistory("ana-test", allMaps(), NEW, NEW.plus(Duration.ofDays(1)));

        assertThat(history.points()).hasSize(1);
    }

    @Test
    void historyRejectsReversedAndTooWideRanges() {
        assertThatThrownBy(() -> historyService.getHeroHistory("ana-test", allMaps(), NEW, OLD))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> historyService.getHeroHistory("ana-test", allMaps(), NEW.minus(Duration.ofDays(400)),
                NEW)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void comparisonListsChangesBiggestGainFirst() {
        StatsComparisonDto comparison = historyService.compare(allMaps(), OLD, NEW);

        assertThat(comparison.beforeCapturedAt()).isEqualTo(OLD);
        assertThat(comparison.afterCapturedAt()).isEqualTo(NEW);
        assertThat(comparison.heroes()).extracting(change -> change.heroSlug())
                .containsExactly("genji-test", "ana-test");
        assertThat(comparison.heroes().get(0).winRateChange()).isEqualByComparingTo("14.00");
        assertThat(comparison.heroes().get(1).pickRateChange()).isEqualByComparingTo("13.00");
    }

    @Test
    void comparisonBeforeTheFirstSnapshotIsNotFound() {
        assertThatThrownBy(() -> historyService.compare(allMaps(), OLD.minus(Duration.ofDays(30)), NEW))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void patchComparisonUsesTheLastSnapshotBeforeReleaseAndOneAfterAWeek() {
        Patch patch = new Patch();
        patch.setVersion("test-patch");
        patch.setSlug("test-patch");
        patch.setReleasedAt(OLD.plus(Duration.ofDays(1)));
        patchRepository.save(patch);

        StatsComparisonDto comparison = historyService.compareAroundPatch(allMaps(), "test-patch");

        assertThat(comparison.beforeCapturedAt()).isEqualTo(OLD);
        assertThat(comparison.afterCapturedAt()).isEqualTo(NEW);
        assertThat(comparison.heroes()).hasSize(2);
    }

    @Test
    void patchComparisonStopsAtTheNextPatch() {
        Patch patch = new Patch();
        patch.setVersion("first-patch");
        patch.setSlug("first-patch");
        patch.setReleasedAt(OLD.plus(Duration.ofDays(1)));
        patchRepository.save(patch);
        Patch next = new Patch();
        next.setVersion("second-patch");
        next.setSlug("second-patch");
        next.setReleasedAt(OLD.plus(Duration.ofDays(3)));
        patchRepository.save(next);

        StatsComparisonDto comparison = historyService.compareAroundPatch(allMaps(), "first-patch");

        assertThat(comparison.afterCapturedAt()).isEqualTo(OLD);
    }

    @Test
    void marksAHeroWhoseRoleChangedBetweenTheTwoSnapshots() {
        saveRoleChange(ana, OLD.plus(Duration.ofDays(3)));
        saveRoleChange(genji, OLD.minus(Duration.ofDays(1)));

        StatsComparisonDto comparison = historyService.compare(allMaps(), OLD, NEW);

        HeroChangeDto anaChange = comparison.heroes().stream()
                .filter(change -> change.heroSlug().equals("ana-test")).findFirst().orElseThrow();
        HeroChangeDto genjiChange = comparison.heroes().stream()
                .filter(change -> change.heroSlug().equals("genji-test")).findFirst().orElseThrow();
        assertThat(anaChange.roleChange()).isNotNull();
        assertThat(anaChange.roleChange().previousRole()).isEqualTo(HeroRole.DAMAGE);
        assertThat(anaChange.roleChange().newRole()).isEqualTo(HeroRole.SUPPORT);
        assertThat(genjiChange.roleChange()).isNull();
    }

    private void saveRoleChange(Hero hero, Instant changedAt) {
        HeroRoleChange change = new HeroRoleChange();
        change.setHero(hero);
        change.setChangedAt(changedAt);
        change.setPreviousRole(HeroRole.DAMAGE);
        change.setNewRole(HeroRole.SUPPORT);
        roleChangeRepository.saveAndFlush(change);
    }

    private StatsFilter allMaps() {
        return StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, StatsFilter.ALL_MAPS, Platform.PC, Region.EUROPE);
    }

    private Hero hero(String slug, String name, HeroRole role) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        hero.setName(name);
        hero.setRole(role);
        return heroRepository.save(hero);
    }

    private HeroStat stat(Hero hero, GameMap map, RankTier tier, Instant capturedAt, String winRate, String pickRate) {
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setMap(map);
        stat.setQueue(GameQueue.COMPETITIVE);
        stat.setGameFormat(GameFormat.FIVE_VS_FIVE);
        stat.setPlatform(Platform.PC);
        stat.setRegion(Region.EUROPE);
        stat.setTier(tier);
        stat.setWinRate(new BigDecimal(winRate));
        stat.setPickRate(new BigDecimal(pickRate));
        stat.setBanRate(new BigDecimal("5.00"));
        stat.setCapturedAt(capturedAt);
        return stat;
    }
}
