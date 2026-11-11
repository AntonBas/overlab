package gg.overlab.backend.stats;

import gg.overlab.backend.stats.dto.CoverageDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsCoverageService {

    private static final String CACHE_KEY = "'coverage'";

    private final SnapshotCheckRepository snapshotCheckRepository;

    @Cacheable(value = StatsSnapshotProvider.CACHE_NAME, key = CACHE_KEY)
    @Transactional(readOnly = true)
    public List<CoverageDto> coverage() {
        Map<String, CoverageBuilder> builders = new LinkedHashMap<>();
        snapshotCheckRepository.findAll().stream()
                .sorted(Comparator.comparing(SnapshotCheck::getPlatform)
                        .thenComparing(SnapshotCheck::getRegion)
                        .thenComparing(SnapshotCheck::getQueue))
                .forEach(check -> builders
                        .computeIfAbsent(check.getPlatform() + ":" + check.getRegion() + ":" + check.getQueue(),
                                key -> new CoverageBuilder(check.getQueue(), check.getPlatform(), check.getRegion()))
                        .add(check));
        return builders.values().stream().map(CoverageBuilder::build).toList();
    }

    private static final class CoverageBuilder {

        private final GameQueue queue;
        private final Platform platform;
        private final Region region;
        private final Set<RankTier> tiers = EnumSet.noneOf(RankTier.class);
        private final Set<RankTier> mapTiers = EnumSet.noneOf(RankTier.class);

        private CoverageBuilder(GameQueue queue, Platform platform, Region region) {
            this.queue = queue;
            this.platform = platform;
            this.region = region;
        }

        private void add(SnapshotCheck check) {
            if (StatsFilter.ALL_MAPS.equals(check.getMapKey())) {
                tiers.add(check.getTier());
            } else {
                mapTiers.add(check.getTier());
            }
        }

        private CoverageDto build() {
            return new CoverageDto(queue, platform, region, List.copyOf(tiers), List.copyOf(mapTiers));
        }
    }
}
