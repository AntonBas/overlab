package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.collector.BlizzardRatesResponse;
import gg.overlab.backend.collector.SnapshotRecorder;
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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class SnapshotRecorderIntegrationTest {

    private static final Instant FIRST = Instant.parse("2026-10-01T04:00:00Z");
    private static final Instant SECOND = Instant.parse("2026-10-02T04:00:00Z");
    private static final Instant THIRD = Instant.parse("2026-10-03T04:00:00Z");
    private static final String MAP = "all-maps";

    @Autowired
    private SnapshotRecorder recorder;

    @Autowired
    private SnapshotCheckRepository checkRepository;

    @Autowired
    private HeroStatRepository heroStatRepository;

    @Autowired
    private HeroRepository heroRepository;

    private List<BlizzardRatesResponse.HeroRate> rates(String winRate) {
        return List.of(
                new BlizzardRatesResponse.HeroRate("record-ana", new BlizzardRatesResponse.Cells("Ana",
                        new BigDecimal(winRate), new BigDecimal("20.1"), new BigDecimal("11.9")),
                        new BlizzardRatesResponse.HeroInfo("Ana", "SUPPORT", "tactician", null, null)),
                new BlizzardRatesResponse.HeroRate("record-genji", new BlizzardRatesResponse.Cells("Genji",
                        new BigDecimal("50.5"), new BigDecimal("9.0"), new BigDecimal("1.5")),
                        new BlizzardRatesResponse.HeroInfo("Genji", "DAMAGE", "flanker", null, null)));
    }

    private SnapshotRecorder.Outcome record(Instant at, String winRate, String etag) {
        return recorder.record(at, GameQueue.COMPETITIVE, GameFormat.FIVE_VS_FIVE, Platform.CONSOLE, Region.AMERICAS,
                RankTier.MASTER, MAP, rates(winRate), etag);
    }

    private SnapshotCheck check() {
        return checkRepository.findByQueueAndPlatformAndRegionAndTierAndMapKey(GameQueue.COMPETITIVE,
                Platform.CONSOLE, Region.AMERICAS, RankTier.MASTER, MAP).orElseThrow();
    }

    private long snapshotCount() {
        return heroStatRepository.findAll().stream()
                .filter(stat -> stat.getPlatform() == Platform.CONSOLE && stat.getRegion() == Region.AMERICAS
                        && stat.getTier() == RankTier.MASTER)
                .map(HeroStat::getCapturedAt)
                .distinct()
                .count();
    }

    @Test
    void theFirstCollectionIsStoredAndRemembered() {
        SnapshotRecorder.Outcome outcome = record(FIRST, "47.1", "W/\"1\"");

        assertThat(outcome.changed()).isTrue();
        assertThat(outcome.rowsSaved()).isEqualTo(2);
        assertThat(snapshotCount()).isEqualTo(1);
        assertThat(check().getEtag()).isEqualTo("W/\"1\"");
        assertThat(check().getLastChangedAt()).isEqualTo(FIRST);
    }

    @Test
    void identicalNumbersAreNotStoredAgainButTheCheckIsUpdated() {
        record(FIRST, "47.1", "W/\"1\"");

        SnapshotRecorder.Outcome outcome = record(SECOND, "47.1", "W/\"1\"");

        assertThat(outcome.changed()).isFalse();
        assertThat(outcome.rowsSaved()).isZero();
        assertThat(snapshotCount()).isEqualTo(1);
        assertThat(check().getLastCheckedAt()).isEqualTo(SECOND);
        assertThat(check().getLastChangedAt()).isEqualTo(FIRST);
    }

    @Test
    void changedNumbersAreStoredAsANewSnapshot() {
        record(FIRST, "47.1", "W/\"1\"");
        record(SECOND, "47.1", "W/\"1\"");

        SnapshotRecorder.Outcome outcome = record(THIRD, "48.0", "W/\"2\"");

        assertThat(outcome.changed()).isTrue();
        assertThat(snapshotCount()).isEqualTo(2);
        assertThat(check().getLastChangedAt()).isEqualTo(THIRD);
        assertThat(check().getEtag()).isEqualTo("W/\"2\"");
    }

    @Test
    void trailingZerosDoNotCountAsAChange() {
        record(FIRST, "47.1", null);

        assertThat(record(SECOND, "47.10", null).changed()).isFalse();
    }

    @Test
    void existingSnapshotsWithoutACheckAreRecognisedAsUnchanged() {
        Hero ana = hero("record-ana", "Ana", HeroRole.SUPPORT);
        Hero genji = hero("record-genji", "Genji", HeroRole.DAMAGE);
        heroStatRepository.save(stat(ana, "47.10", "20.10", "11.90"));
        heroStatRepository.saveAndFlush(stat(genji, "50.50", "9.00", "1.50"));

        SnapshotRecorder.Outcome outcome = record(SECOND, "47.1", "W/\"1\"");

        assertThat(outcome.changed()).isFalse();
        assertThat(snapshotCount()).isEqualTo(1);
        assertThat(check().getLastChangedAt()).isEqualTo(FIRST);
    }

    @Test
    void markingUnchangedOnlyMovesTheCheckedTime() {
        record(FIRST, "47.1", "W/\"1\"");

        boolean marked = recorder.markUnchanged(SECOND, GameQueue.COMPETITIVE, Platform.CONSOLE, Region.AMERICAS,
                RankTier.MASTER, MAP);

        assertThat(marked).isTrue();
        assertThat(check().getLastCheckedAt()).isEqualTo(SECOND);
        assertThat(snapshotCount()).isEqualTo(1);
    }

    @Test
    void markingUnchangedWithoutAnyHistoryDoesNothing() {
        assertThat(recorder.markUnchanged(SECOND, GameQueue.QUICK_PLAY, Platform.CONSOLE, Region.ASIA,
                RankTier.ALL, "no-such-map")).isFalse();
    }

    @Test
    void theKnownEtagIsAvailableForTheNextRequest() {
        record(FIRST, "47.1", "W/\"1\"");

        assertThat(recorder.knownEtag(GameQueue.COMPETITIVE, Platform.CONSOLE, Region.AMERICAS, RankTier.MASTER, MAP))
                .contains("W/\"1\"");
    }

    private Hero hero(String slug, String name, HeroRole role) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        hero.setName(name);
        hero.setRole(role);
        return heroRepository.save(hero);
    }

    private HeroStat stat(Hero hero, String win, String pick, String ban) {
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setQueue(GameQueue.COMPETITIVE);
        stat.setGameFormat(GameFormat.FIVE_VS_FIVE);
        stat.setPlatform(Platform.CONSOLE);
        stat.setRegion(Region.AMERICAS);
        stat.setTier(RankTier.MASTER);
        stat.setWinRate(new BigDecimal(win));
        stat.setPickRate(new BigDecimal(pick));
        stat.setBanRate(new BigDecimal(ban));
        stat.setCapturedAt(FIRST);
        return stat;
    }
}
