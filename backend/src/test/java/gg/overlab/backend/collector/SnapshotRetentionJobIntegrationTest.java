package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.integration.IntegrationTest;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.HeroStat;
import gg.overlab.backend.stats.HeroStatRepository;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class SnapshotRetentionJobIntegrationTest {

    @Autowired
    private SnapshotRetentionJob job;

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private HeroStatRepository heroStatRepository;

    @Test
    void keepsLatestSnapshotPerWeekForOldDataAndAllRecentData() {
        Hero newHero = new Hero();
        newHero.setSlug("retention-test-hero");
        newHero.setName("Retention Test");
        newHero.setRole(HeroRole.TANK);
        Hero hero = heroRepository.saveAndFlush(newHero);

        Instant weekStart = Instant.now().minus(Duration.ofDays(300)).atZone(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toLocalDate().atStartOfDay(ZoneOffset.UTC)
                .toInstant();
        Instant recent = Instant.now().minus(Duration.ofDays(1));
        List<Instant> moments = List.of(weekStart.plus(Duration.ofHours(1)), weekStart.plus(Duration.ofDays(2)),
                weekStart.plus(Duration.ofDays(3)), weekStart.plus(Duration.ofDays(8)), recent);
        for (Instant moment : moments) {
            heroStatRepository.save(stat(hero, moment));
        }
        heroStatRepository.flush();

        int deleted = job.thinOutOldSnapshots();

        List<Instant> remaining = heroStatRepository.findAll().stream()
                .filter(row -> row.getHero().getId().equals(hero.getId()))
                .map(HeroStat::getCapturedAt)
                .sorted()
                .toList();
        assertThat(deleted).isEqualTo(2);
        assertThat(remaining).hasSize(3);
        assertThat(remaining.get(0)).isEqualTo(moments.get(2));
        assertThat(remaining.get(1)).isEqualTo(moments.get(3));
        assertThat(remaining.get(2)).isEqualTo(recent);
    }

    @Test
    void keepsTheLatestSnapshotOfEveryCombinationInEachWeekIndependently() {
        Hero newHero = new Hero();
        newHero.setSlug("retention-groups-hero");
        newHero.setName("Retention Groups");
        newHero.setRole(HeroRole.SUPPORT);
        Hero hero = heroRepository.saveAndFlush(newHero);
        Instant weekStart = Instant.now().minus(Duration.ofDays(400)).atZone(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toLocalDate().atStartOfDay(ZoneOffset.UTC)
                .toInstant();
        for (int week = 0; week < 3; week++) {
            Instant base = weekStart.plus(Duration.ofDays(7L * week));
            for (RankTier tier : List.of(RankTier.ALL, RankTier.GOLD)) {
                heroStatRepository.save(stat(hero, base.plus(Duration.ofDays(1)), tier));
                heroStatRepository.save(stat(hero, base.plus(Duration.ofDays(4)), tier));
            }
        }
        heroStatRepository.flush();

        int deleted = job.thinOutOldSnapshots();

        List<HeroStat> remaining = heroStatRepository.findAll().stream()
                .filter(row -> row.getHero().getId().equals(hero.getId()))
                .toList();
        assertThat(deleted).isEqualTo(6);
        assertThat(remaining).hasSize(6);
        assertThat(remaining).allMatch(row -> row.getCapturedAt().atZone(ZoneOffset.UTC).getDayOfWeek()
                == DayOfWeek.FRIDAY);
    }

    @Test
    void doesNothingWhenThereIsNoOldData() {
        assertThat(job.thinOutOldSnapshots()).isGreaterThanOrEqualTo(0);
    }

    private HeroStat stat(Hero hero, Instant capturedAt) {
        return stat(hero, capturedAt, RankTier.ALL);
    }

    private HeroStat stat(Hero hero, Instant capturedAt, RankTier tier) {
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setQueue(GameQueue.COMPETITIVE);
        stat.setGameFormat(GameFormat.FIVE_VS_FIVE);
        stat.setPlatform(Platform.PC);
        stat.setRegion(Region.EUROPE);
        stat.setTier(tier);
        stat.setWinRate(new BigDecimal("50.00"));
        stat.setPickRate(new BigDecimal("10.00"));
        stat.setCapturedAt(capturedAt);
        return stat;
    }
}
