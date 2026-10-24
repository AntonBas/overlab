package gg.overlab.backend.collector;

import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RatesCollectorService {

    private static final String EACH_MAP = "EACH";

    private final CollectorProperties properties;
    private final BlizzardRatesClient client;
    private final RatesSnapshotWriter writer;
    private final GameMapRepository gameMapRepository;

    public int collect(CollectorJob job) {
        Instant capturedAt = Instant.now();
        int savedRows = 0;
        int failedRequests = 0;
        List<String> mapSlugs = resolveMapSlugs(job);
        log.info("Collector job '{}' started", job.name());
        for (GameQueue queue : job.queues()) {
            for (Platform platform : job.platforms()) {
                for (Region region : job.regions()) {
                    for (RankTier tier : job.tiers()) {
                        if (queue == GameQueue.QUICK_PLAY && tier != RankTier.ALL) {
                            continue;
                        }
                        for (String mapSlug : mapSlugs) {
                            int rows = collectOne(capturedAt, queue, platform, region, tier, mapSlug);
                            if (rows < 0) {
                                failedRequests++;
                            } else {
                                savedRows += rows;
                            }
                            pause();
                        }
                    }
                }
            }
        }
        log.info("Collector job '{}' finished: {} rows saved, {} failed requests", job.name(), savedRows, failedRequests);
        return savedRows;
    }

    public void collectByName(String jobName) {
        List<CollectorJob> jobs = properties.jobs();
        jobs.stream()
                .filter(job -> job.name().equals(jobName))
                .findFirst()
                .ifPresentOrElse(this::collect, () -> log.warn("Collector job '{}' not found", jobName));
    }

    private List<String> resolveMapSlugs(CollectorJob job) {
        List<String> slugs = new ArrayList<>();
        for (String map : job.maps()) {
            if (EACH_MAP.equals(map)) {
                gameMapRepository.findAll().forEach(gameMap -> slugs.add(gameMap.getSlug()));
            } else {
                slugs.add(map);
            }
        }
        return slugs;
    }

    private int collectOne(Instant capturedAt, GameQueue queue, Platform platform, Region region, RankTier tier,
                           String mapSlug) {
        try {
            List<BlizzardRatesResponse.HeroRate> rates = client.fetch(queue, platform, region, tier, mapSlug);
            return writer.save(capturedAt, queue, properties.gameFormat(), platform, region, tier, mapSlug, rates);
        } catch (RuntimeException exception) {
            log.warn("Collector request failed: queue={} platform={} region={} tier={} map={}: {}",
                    queue, platform, region, tier, mapSlug, exception.getMessage());
            return -1;
        }
    }

    private void pause() {
        try {
            Thread.sleep(properties.pause());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
