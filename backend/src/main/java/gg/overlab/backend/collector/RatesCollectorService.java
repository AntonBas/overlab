package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunDto;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.config.async.AsyncConfig;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.StatsSnapshotProvider;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class RatesCollectorService {

    private static final String EACH_MAP = "EACH";
    private static final int MAX_ERROR_SUMMARY_LENGTH = 1000;
    private static final int MAX_DISTINCT_ERRORS = 3;

    private final CollectorProperties properties;
    private final BlizzardRatesClient client;
    private final RatesValidator validator;
    private final SnapshotRecorder recorder;
    private final GameMapRepository gameMapRepository;
    private final CacheManager cacheManager;
    private final CollectorRunRepository runRepository;
    private final CollectorMetrics metrics;
    private final TaskExecutor executor;
    private final Set<String> runningJobs = ConcurrentHashMap.newKeySet();
    private final ReentrantLock requestsLock = new ReentrantLock();

    public RatesCollectorService(CollectorProperties properties, BlizzardRatesClient client,
                                 RatesValidator validator, SnapshotRecorder recorder,
                                 GameMapRepository gameMapRepository, CacheManager cacheManager,
                                 CollectorRunRepository runRepository, CollectorMetrics metrics,
                                 @Qualifier(AsyncConfig.COLLECTOR_EXECUTOR) TaskExecutor executor) {
        this.properties = properties;
        this.client = client;
        this.validator = validator;
        this.recorder = recorder;
        this.gameMapRepository = gameMapRepository;
        this.cacheManager = cacheManager;
        this.runRepository = runRepository;
        this.metrics = metrics;
        this.executor = executor;
    }

    public List<CollectorJob> jobs() {
        return properties.jobs();
    }

    public CollectorRunDto startAsync(String jobName, CollectorTrigger trigger) {
        CollectorJob job = findJob(jobName);
        CollectorRun run = begin(job, trigger);
        executor.execute(() -> finish(job, run));
        return CollectorRunDto.from(run);
    }

    public void runBlocking(String jobName, CollectorTrigger trigger) {
        CollectorJob job = findJob(jobName);
        try {
            CollectorRun run = begin(job, trigger);
            finish(job, run);
        } catch (ConflictException exception) {
            log.warn("Collector job '{}' skipped: {}", jobName, exception.getMessage());
        }
    }

    private CollectorJob findJob(String jobName) {
        return properties.jobs().stream()
                .filter(job -> job.name().equals(jobName))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Collector job", jobName));
    }

    private CollectorRun begin(CollectorJob job, CollectorTrigger trigger) {
        if (!runningJobs.add(job.name())) {
            throw new ConflictException("Collector job is already running: " + job.name());
        }
        try {
            CollectorRun run = new CollectorRun();
            run.setJobName(job.name());
            run.setTrigger(trigger);
            run.setStatus(CollectorRunStatus.RUNNING);
            run.setStartedAt(Instant.now());
            return runRepository.save(run);
        } catch (RuntimeException exception) {
            runningJobs.remove(job.name());
            throw exception;
        }
    }

    private void finish(CollectorJob job, CollectorRun run) {
        try {
            executeExclusively(job, run);
        } catch (RuntimeException exception) {
            log.error("Collector job '{}' crashed", job.name(), exception);
            run.setStatus(CollectorRunStatus.FAILED);
            run.setErrorSummary(truncate(String.valueOf(exception.getMessage())));
        } finally {
            run.setFinishedAt(Instant.now());
            runRepository.save(run);
            metrics.recordRun(job.name(), run.getStatus(), run.getRowsSaved(),
                    Duration.between(run.getStartedAt(), run.getFinishedAt()));
            runningJobs.remove(job.name());
        }
    }

    private void executeExclusively(CollectorJob job, CollectorRun run) {
        requestsLock.lock();
        try {
            run.setStartedAt(Instant.now());
            execute(job, run);
        } finally {
            requestsLock.unlock();
        }
    }

    private void execute(CollectorJob job, CollectorRun run) {
        Instant capturedAt = Instant.now();
        Set<String> errors = new LinkedHashSet<>();
        List<String> mapSlugs = resolveMapSlugs(job);
        log.info("Collector job '{}' started ({})", job.name(), run.getTrigger());
        for (GameQueue queue : job.queues()) {
            for (Platform platform : job.platforms()) {
                for (Region region : job.regions()) {
                    for (RankTier tier : job.tiers()) {
                        if (queue == GameQueue.QUICK_PLAY && tier != RankTier.ALL) {
                            continue;
                        }
                        for (String mapSlug : mapSlugs) {
                            run.setRequestsTotal(run.getRequestsTotal() + 1);
                            try {
                                run.setRowsSaved(run.getRowsSaved()
                                        + collectOne(capturedAt, queue, platform, region, tier, mapSlug));
                                metrics.recordRequest(job.name(), true);
                            } catch (RuntimeException exception) {
                                run.setRequestsFailed(run.getRequestsFailed() + 1);
                                metrics.recordRequest(job.name(), false);
                                if (exception instanceof InvalidSnapshotException) {
                                    metrics.recordRejectedSnapshot();
                                }
                                if (errors.size() < MAX_DISTINCT_ERRORS) {
                                    errors.add(describe(queue, platform, region, tier, mapSlug, exception));
                                }
                                log.warn("Collector request failed: {}",
                                        describe(queue, platform, region, tier, mapSlug, exception));
                            }
                            pause();
                        }
                    }
                }
            }
        }
        run.setStatus(statusOf(run));
        run.setErrorSummary(errors.isEmpty() ? null : truncate(String.join("; ", errors)));
        evictCaches();
        log.info("Collector job '{}' finished: {} rows saved, {} of {} requests failed", job.name(),
                run.getRowsSaved(), run.getRequestsFailed(), run.getRequestsTotal());
    }

    private CollectorRunStatus statusOf(CollectorRun run) {
        if (run.getRequestsFailed() == 0) {
            return CollectorRunStatus.SUCCESS;
        }
        return run.getRowsSaved() > 0 ? CollectorRunStatus.PARTIAL : CollectorRunStatus.FAILED;
    }

    private int collectOne(Instant capturedAt, GameQueue queue, Platform platform, Region region, RankTier tier,
                           String mapSlug) {
        String knownEtag = recorder.knownEtag(queue, platform, region, tier, mapSlug).orElse(null);
        RatesFetch fetched = client.fetch(queue, platform, region, tier, mapSlug, knownEtag);
        if (fetched.notModified()
                && recorder.markUnchanged(capturedAt, queue, platform, region, tier, mapSlug)) {
            metrics.recordUnchangedSnapshot();
            return 0;
        }
        RatesFetch usable = fetched.notModified() ? client.fetch(queue, platform, region, tier, mapSlug) : fetched;
        validator.validate(usable.rates());
        List<BlizzardRatesResponse.HeroRate> heroesWithData = validator.withoutEmptyEntries(usable.rates());
        validator.validateBanRates(queue, heroesWithData);
        SnapshotRecorder.Outcome outcome = recorder.record(capturedAt, queue, properties.gameFormat(), platform,
                region, tier, mapSlug, heroesWithData, usable.etag());
        if (!outcome.changed()) {
            metrics.recordUnchangedSnapshot();
        }
        return outcome.rowsSaved();
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

    private void evictCaches() {
        for (String cacheName : List.of(StatsSnapshotProvider.CACHE_NAME, HeroService.CACHE_NAME, MapService.CACHE_NAME)) {
            Cache cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        }
    }

    private String describe(GameQueue queue, Platform platform, Region region, RankTier tier, String mapSlug,
                            RuntimeException exception) {
        return queue + "/" + platform + "/" + region + "/" + tier + "/" + mapSlug + ": " + exception.getMessage();
    }

    private String truncate(String text) {
        return text.length() > MAX_ERROR_SUMMARY_LENGTH ? text.substring(0, MAX_ERROR_SUMMARY_LENGTH) : text;
    }

    private void pause() {
        try {
            Thread.sleep(properties.pause());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
