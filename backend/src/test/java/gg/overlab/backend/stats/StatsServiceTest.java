package gg.overlab.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class StatsServiceTest {

    private final StatsSnapshotProvider snapshotProvider = mock(StatsSnapshotProvider.class);
    private final StatsService service = new StatsService(snapshotProvider, mock(HeroStatRepository.class),
            mock(HeroService.class), new StatsMapper());

    private final StatsFilter filter = StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, "all-maps", Platform.PC,
            Region.EUROPE);

    @BeforeEach
    void stubSnapshot() {
        StatsSnapshotDto snapshot = new StatsSnapshotDto(StatsFixtures.CAPTURED_AT, GameQueue.COMPETITIVE, RankTier.ALL,
                "all-maps", Platform.PC, Region.EUROPE, List.of(
                row("Ana", HeroRole.SUPPORT, "47.10", "23.10"),
                row("Genji", HeroRole.DAMAGE, "55.10", "15.30"),
                row("Reinhardt", HeroRole.TANK, "53.80", "9.00"),
                row("Moira", HeroRole.SUPPORT, "49.30", "25.60")));
        when(snapshotProvider.getSnapshot(filter)).thenReturn(snapshot);
    }

    @Test
    void sortsByPickRateDescending() {
        StatsSnapshotDto result = service.getStats(filter, null, StatsSort.PICK_RATE, true);

        assertThat(result.heroes()).extracting(HeroStatDto::heroName).containsExactly("Moira", "Ana", "Genji", "Reinhardt");
    }

    @Test
    void sortsByWinRateAscending() {
        StatsSnapshotDto result = service.getStats(filter, null, StatsSort.WIN_RATE, false);

        assertThat(result.heroes()).extracting(HeroStatDto::heroName).containsExactly("Ana", "Moira", "Reinhardt", "Genji");
    }

    @Test
    void sortsByNameAscending() {
        StatsSnapshotDto result = service.getStats(filter, null, StatsSort.NAME, false);

        assertThat(result.heroes()).extracting(HeroStatDto::heroName).containsExactly("Ana", "Genji", "Moira", "Reinhardt");
    }

    @Test
    void filtersByRole() {
        StatsSnapshotDto result = service.getStats(filter, HeroRole.SUPPORT, StatsSort.PICK_RATE, true);

        assertThat(result.heroes()).extracting(HeroStatDto::heroName).containsExactly("Moira", "Ana");
    }

    private HeroStatDto row(String name, HeroRole role, String winRate, String pickRate) {
        return new HeroStatDto(name.toLowerCase(), name, role, null, new BigDecimal(winRate), new BigDecimal(pickRate),
                null, null, null, null);
    }
}
