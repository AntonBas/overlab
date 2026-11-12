package gg.overlab.backend.collector.snapshot;

import gg.overlab.backend.collector.client.BlizzardRatesResponse;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.HeroStat;
import gg.overlab.backend.stats.HeroStatRepository;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.SnapshotCheck;
import gg.overlab.backend.stats.SnapshotCheckRepository;
import gg.overlab.backend.stats.SnapshotSignature;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SnapshotRecorder {

    private final RatesSnapshotWriter writer;
    private final SnapshotCheckRepository checkRepository;
    private final HeroStatRepository heroStatRepository;

    public record Outcome(int rowsSaved, boolean changed) {
    }

    @Transactional(readOnly = true)
    public Optional<String> knownEtag(GameQueue queue, Platform platform, Region region, RankTier tier,
                                      String mapSlug) {
        return find(queue, platform, region, tier, mapSlug).map(SnapshotCheck::getEtag);
    }

    @Transactional
    public boolean markUnchanged(Instant checkedAt, GameQueue queue, Platform platform, Region region,
                                 RankTier tier, String mapSlug) {
        Optional<SnapshotCheck> check = find(queue, platform, region, tier, mapSlug);
        check.ifPresent(existing -> existing.setLastCheckedAt(checkedAt));
        return check.isPresent();
    }

    @Transactional
    public Outcome record(Instant capturedAt, GameQueue queue, GameFormat gameFormat, Platform platform,
                          Region region, RankTier tier, String mapSlug,
                          List<BlizzardRatesResponse.HeroRate> rates, String etag) {
        String signature = signatureOf(queue, rates);
        SnapshotCheck check = find(queue, platform, region, tier, mapSlug)
                .orElseGet(() -> newCheck(queue, gameFormat, platform, region, tier, mapSlug, capturedAt));
        boolean unchanged = check.getSignature().equals(signature);
        check.setLastCheckedAt(capturedAt);
        check.setEtag(etag);
        if (unchanged) {
            checkRepository.save(check);
            return new Outcome(0, false);
        }
        int rows = writer.save(capturedAt, queue, gameFormat, platform, region, tier, mapSlug, rates);
        check.setSignature(signature);
        check.setLastChangedAt(capturedAt);
        checkRepository.save(check);
        return new Outcome(rows, true);
    }

    private Optional<SnapshotCheck> find(GameQueue queue, Platform platform, Region region, RankTier tier,
                                         String mapSlug) {
        return checkRepository.findByQueueAndPlatformAndRegionAndTierAndMapKey(queue, platform, region, tier,
                mapSlug);
    }

    private SnapshotCheck newCheck(GameQueue queue, GameFormat gameFormat, Platform platform, Region region,
                                   RankTier tier, String mapSlug, Instant capturedAt) {
        List<HeroStat> latest = StatsFilter.ALL_MAPS.equals(mapSlug)
                ? heroStatRepository.findLatestForAllMaps(queue, gameFormat, platform, region, tier)
                : heroStatRepository.findLatestForMap(mapSlug, queue, gameFormat, platform, region, tier);
        SnapshotCheck check = new SnapshotCheck();
        check.setQueue(queue);
        check.setPlatform(platform);
        check.setRegion(region);
        check.setTier(tier);
        check.setMapKey(mapSlug);
        check.setLastCheckedAt(capturedAt);
        if (latest.isEmpty()) {
            check.setSignature("");
            check.setLastChangedAt(capturedAt);
        } else {
            check.setSignature(SnapshotSignature.ofStats(latest));
            check.setLastChangedAt(latest.get(0).getCapturedAt());
        }
        return check;
    }

    private String signatureOf(GameQueue queue, List<BlizzardRatesResponse.HeroRate> rates) {
        return SnapshotSignature.of(rates.stream()
                .map(rate -> new SnapshotSignature.Entry(rate.id(), rate.cells().winrate(),
                        rate.cells().pickrate(), queue == GameQueue.COMPETITIVE ? rate.cells().banrate() : null))
                .toList());
    }
}
