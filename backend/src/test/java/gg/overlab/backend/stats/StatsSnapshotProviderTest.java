package gg.overlab.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class StatsSnapshotProviderTest {

    private final HeroStatRepository repository = mock(HeroStatRepository.class);
    private final StatsSnapshotProvider provider = new StatsSnapshotProvider(repository, new StatsMapper());

    private final Hero ana = StatsFixtures.hero(1, "ana", "Ana", HeroRole.SUPPORT);
    private final Hero genji = StatsFixtures.hero(2, "genji", "Genji", HeroRole.DAMAGE);

    @Test
    void allMapsSnapshotHasNoDeltas() {
        StatsFilter filter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "all-maps", Platform.PC, Region.EUROPE);
        when(repository.findLatestForAllMaps(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.ALL))
                .thenReturn(List.of(StatsFixtures.stat(ana, null, "47.10", "23.10", "11.90")));

        StatsSnapshotDto snapshot = provider.getSnapshot(filter);

        assertThat(snapshot.capturedAt()).isEqualTo(StatsFixtures.CAPTURED_AT);
        assertThat(snapshot.heroes()).hasSize(1);
        HeroStatDto hero = snapshot.heroes().get(0);
        assertThat(hero.heroSlug()).isEqualTo("ana");
        assertThat(hero.winRateDelta()).isNull();
        assertThat(hero.pickRateDelta()).isNull();
    }

    @Test
    void mapSnapshotComputesDeltaAgainstAllMaps() {
        StatsFilter filter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "rialto", Platform.PC, Region.EUROPE);
        when(repository.findLatestForMap("rialto", GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.ALL))
                .thenReturn(List.of(StatsFixtures.stat(ana, StatsFixtures.map("rialto", "Rialto"), "48.00", "26.20", "11.90")));
        when(repository.findLatestForAllMaps(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.ALL))
                .thenReturn(List.of(StatsFixtures.stat(ana, null, "47.10", "23.10", "11.90")));

        HeroStatDto hero = provider.getSnapshot(filter).heroes().get(0);

        assertThat(hero.winRateDelta()).isEqualByComparingTo(new BigDecimal("0.90"));
        assertThat(hero.pickRateDelta()).isEqualByComparingTo(new BigDecimal("3.10"));
        assertThat(hero.banRateDelta()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void heroMissingFromBaselineHasNoDelta() {
        StatsFilter filter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "rialto", Platform.PC, Region.EUROPE);
        when(repository.findLatestForMap("rialto", GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.ALL))
                .thenReturn(List.of(StatsFixtures.stat(genji, StatsFixtures.map("rialto", "Rialto"), "55.10", "14.10", "10.30")));
        when(repository.findLatestForAllMaps(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.ALL))
                .thenReturn(List.of(StatsFixtures.stat(ana, null, "47.10", "23.10", "11.90")));

        HeroStatDto hero = provider.getSnapshot(filter).heroes().get(0);

        assertThat(hero.winRateDelta()).isNull();
    }

    @Test
    void quickPlayBanRateStaysNull() {
        StatsFilter filter = StatsFilter.of(GameQueue.QUICK_PLAY, RankTier.GOLD, "all-maps", Platform.PC, Region.EUROPE);
        when(repository.findLatestForAllMaps(GameQueue.QUICK_PLAY, Platform.PC, Region.EUROPE, RankTier.ALL))
                .thenReturn(List.of(StatsFixtures.stat(ana, null, "46.60", "19.10", null)));

        HeroStatDto hero = provider.getSnapshot(filter).heroes().get(0);

        assertThat(hero.banRate()).isNull();
    }

    @Test
    void missingSnapshotThrowsNotFound() {
        StatsFilter filter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.GOLD, "rialto", Platform.PC, Region.EUROPE);
        when(repository.findLatestForMap("rialto", GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.GOLD))
                .thenReturn(List.of());

        assertThatThrownBy(() -> provider.getSnapshot(filter)).isInstanceOf(EntityNotFoundException.class);
    }
}
