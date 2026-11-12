package gg.overlab.backend.stats;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
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

    public static Instant latest(Instant snapshotTime, Optional<Instant> checkedAt) {
        return checkedAt.filter(checked -> checked.isAfter(snapshotTime)).orElse(snapshotTime);
    }
}
