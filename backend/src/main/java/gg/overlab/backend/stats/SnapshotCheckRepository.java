package gg.overlab.backend.stats;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SnapshotCheckRepository extends JpaRepository<SnapshotCheck, Long> {

    Optional<SnapshotCheck> findByQueueAndPlatformAndRegionAndTierAndMapKey(GameQueue queue, Platform platform,
                                                                            Region region, RankTier tier,
                                                                            String mapKey);

    List<SnapshotCheck> findAllByQueueAndPlatformAndRegionAndTier(GameQueue queue, Platform platform,
                                                                 Region region, RankTier tier);

    @Query("select max(c.lastChangedAt) from SnapshotCheck c where c.queue = :queue")
    Optional<Instant> findLatestChange(@Param("queue") GameQueue queue);
}
