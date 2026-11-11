package gg.overlab.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.stats.dto.CoverageDto;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class StatsCoverageServiceTest {

    private final SnapshotCheckRepository repository = mock(SnapshotCheckRepository.class);
    private final StatsCoverageService service = new StatsCoverageService(repository);

    @Test
    void separatesAllMapsRanksFromPerMapRanks() {
        when(repository.findAll()).thenReturn(List.of(
                check(GameQueue.COMPETITIVE, Platform.PC, Region.AMERICAS, RankTier.ALL, "all-maps"),
                check(GameQueue.COMPETITIVE, Platform.PC, Region.AMERICAS, RankTier.GOLD, "all-maps"),
                check(GameQueue.COMPETITIVE, Platform.PC, Region.AMERICAS, RankTier.ALL, "rialto")));

        List<CoverageDto> coverage = service.coverage();

        assertThat(coverage).hasSize(1);
        assertThat(coverage.get(0).tiers()).containsExactlyInAnyOrder(RankTier.ALL, RankTier.GOLD);
        assertThat(coverage.get(0).mapTiers()).containsExactly(RankTier.ALL);
    }

    @Test
    void keepsPlatformsAndRegionsApart() {
        when(repository.findAll()).thenReturn(List.of(
                check(GameQueue.COMPETITIVE, Platform.PC, Region.ASIA, RankTier.ALL, "all-maps"),
                check(GameQueue.COMPETITIVE, Platform.CONSOLE, Region.ASIA, RankTier.ALL, "all-maps"),
                check(GameQueue.QUICK_PLAY, Platform.PC, Region.ASIA, RankTier.ALL, "all-maps")));

        assertThat(service.coverage()).hasSize(3);
    }

    private static SnapshotCheck check(GameQueue queue, Platform platform, Region region, RankTier tier,
                                       String mapKey) {
        SnapshotCheck check = new SnapshotCheck();
        check.setQueue(queue);
        check.setPlatform(platform);
        check.setRegion(region);
        check.setTier(tier);
        check.setMapKey(mapKey);
        check.setSignature("signature");
        check.setLastCheckedAt(Instant.parse("2026-11-11T02:00:00Z"));
        check.setLastChangedAt(Instant.parse("2026-11-11T02:00:00Z"));
        return check;
    }
}
