package gg.overlab.backend.stats;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SnapshotCheckService {

    private final SnapshotCheckRepository repository;

    @Transactional(readOnly = true)
    public Optional<Instant> lastChecked(GameQueue queue, Platform platform, Region region, RankTier tier,
                                         String mapKey) {
        return repository.findByQueueAndPlatformAndRegionAndTierAndMapKey(queue, platform, region, tier, mapKey)
                .map(SnapshotCheck::getLastCheckedAt);
    }

    @Transactional(readOnly = true)
    public Map<String, Instant> lastCheckedByMap(GameQueue queue, Platform platform, Region region,
                                                 RankTier tier) {
        Map<String, Instant> byMap = new HashMap<>();
        repository.findAllByQueueAndPlatformAndRegionAndTier(queue, platform, region, tier)
                .forEach(check -> byMap.put(check.getMapKey(), check.getLastCheckedAt()));
        return byMap;
    }

    @Transactional(readOnly = true)
    public Optional<Instant> latestChange() {
        return Stream.of(GameQueue.values())
                .map(repository::findLatestChange)
                .flatMap(Optional::stream)
                .max(Comparator.naturalOrder());
    }

    public static Instant latest(Instant snapshotTime, Optional<Instant> checkedAt) {
        return checkedAt.filter(checked -> checked.isAfter(snapshotTime)).orElse(snapshotTime);
    }
}
