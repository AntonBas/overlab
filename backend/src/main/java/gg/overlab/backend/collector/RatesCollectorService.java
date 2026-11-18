package gg.overlab.backend.collector;

import gg.overlab.backend.collector.dto.CollectorRunDto;
import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.collector.snapshot.InvalidSnapshotException;
import gg.overlab.backend.common.Pause;
import gg.overlab.backend.common.ScheduledJobLock;
import gg.overlab.backend.config.async.AsyncConfig;
import gg.overlab.backend.config.cache.CacheEviction;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class RatesCollectorService {

    private static final int MAX_CONSECUTIVE_FAILURES = 5;
    private static final String QUEUE_FULL_SUMMARY = "Collector queue is full";
    private static final String OTHER_INSTANCE_SUMMARY = "Another instance is running this job";
    private static final String LOCK_FAILED_SUMMARY = "The job lock could not be taken";

    private final CollectorProperties properties;
    private final SnapshotCollector snapshotCollector;
    private final MapSlugResolver mapSlugResolver;
    private final JobChain jobChain;
    private final CacheEviction cacheEviction;
    private final CollectorRunRepository runRepository;
    private final CollectorMetrics metrics;
    private final TaskExecutor executor;
    private final ScheduledJobLock jobLock;
    private final Set<String> runningJobs = ConcurrentHashMap.newKeySet();
    private final ReentrantLock requestsLock = new ReentrantLock();

    public RatesCollectorService(CollectorProperties properties, SnapshotCollector snapshotCollector,
                                 MapSlugResolver mapSlugResolver, JobChain jobChain, CacheEviction cacheEviction,
                                 CollectorRunRepository runRepository, CollectorMetrics metrics,
                                 @Qualifier(AsyncConfig.COLLECTOR_EXECUTOR) TaskExecutor executor,
                                 ScheduledJobLock jobLock) {
        this.properties = properties;
        this.snapshotCollector = snapshotCollector;
        this.mapSlugResolver = mapSlugResolver;
        this.jobChain = jobChain;
        this.cacheEviction = cacheEviction;
        this.runRepository = runRepository;
        this.metrics = metrics;
        this.executor = executor;
        this.jobLock = jobLock;
    }

    public List<CollectorRunDto> recentRuns() {
        return runRepository.findTop50ByOrderByStartedAtDesc().stream().map(CollectorRunDto::from).toList();
    }

    public List<CollectorJob> jobs() {
        return properties.jobs();
    }

    public CollectorRunDto startAsync(String jobName, CollectorTrigger trigger) {
        CollectorJob job = findJob(jobName);
        CollectorRun run = begin(job, trigger);
        try {
            executor.execute(() -> runUnderLock(job, run));
        } catch (TaskRejectedException exception) {
            abandon(job, run, QUEUE_FULL_SUMMARY);
            throw new ConflictException("Collector queue is full, job was not started: " + job.name());
        }
        return CollectorRunDto.from(run);
    }

    public void startIfPossible(String jobName, CollectorTrigger trigger) {
        try {
            startAsync(jobName, trigger);
        } catch (ConflictException exception) {
            log.warn("Collector job '{}' skipped: {}", jobName, exception.getMessage());
        }
    }

    public boolean runInline(String jobName, CollectorTrigger trigger) {
        CollectorJob job = findJob(jobName);
        try {
            CollectorRun run = begin(job, trigger);
            finish(job, run);
            runDependents(job, run);
            return true;
        } catch (ConflictException exception) {
            log.warn("Collector job '{}' skipped: {}", jobName, exception.getMessage());
            return false;
        }
    }

    private void runDependents(CollectorJob parent, CollectorRun parentRun) {
        for (CollectorJob dependent : jobChain.dependentsToRun(parent, parentRun)) {
            if (Thread.currentThread().isInterrupted()) {
                log.warn("Collector job '{}' was not started after '{}': the thread was interrupted",
                        dependent.name(), parent.name());
                return;
            }
            log.info("Collector job '{}' starts because '{}' saved {} rows", dependent.name(), parent.name(),
                    parentRun.getRowsSaved());
            try {
                runInline(dependent.name(), CollectorTrigger.CHAINED);
            } catch (RuntimeException exception) {
                log.error("Collector job '{}' failed after '{}'", dependent.name(), parent.name(), exception);
            }
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

    private void runUnderLock(CollectorJob job, CollectorRun run) {
        boolean ran;
        try {
            ran = jobLock.runExclusively("collector:" + job.name(), () -> {
                finish(job, run);
                runDependents(job, run);
            });
        } catch (IllegalStateException exception) {
            log.error("Collector job '{}' could not take its lock", job.name(), exception);
            abandon(job, run, LOCK_FAILED_SUMMARY);
            return;
        }
        if (!ran) {
            abandon(job, run, OTHER_INSTANCE_SUMMARY);
        }
    }

    private void abandon(CollectorJob job, CollectorRun run, String summary) {
        run.setStatus(CollectorRunStatus.FAILED);
        run.setErrorSummary(summary);
        run.setFinishedAt(Instant.now());
        runRepository.save(run);
        runningJobs.remove(job.name());
    }

    private void finish(CollectorJob job, CollectorRun run) {
        try {
            executeExclusively(job, run);
        } catch (RuntimeException exception) {
            log.error("Collector job '{}' crashed", job.name(), exception);
            run.setStatus(CollectorRunStatus.FAILED);
            run.setErrorSummary(RunErrors.truncate(String.valueOf(exception.getMessage())));
        } finally {
            try {
                run.setFinishedAt(Instant.now());
                runRepository.save(run);
                metrics.recordRun(job.name(), run.getStatus(), run.getRowsSaved(),
                        Duration.between(run.getStartedAt(), run.getFinishedAt()));
            } finally {
                runningJobs.remove(job.name());
            }
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
        RunErrors errors = new RunErrors();
        List<SnapshotRequest> requests = SnapshotRequest.plan(job, mapSlugResolver.resolve(job));
        log.info("Collector job '{}' started ({})", job.name(), run.getTrigger());
        int consecutiveFailures = 0;
        boolean interrupted = false;
        for (SnapshotRequest request : requests) {
            run.setRequestsTotal(run.getRequestsTotal() + 1);
            try {
                run.setRowsSaved(run.getRowsSaved() + snapshotCollector.collect(capturedAt, request));
                metrics.recordRequest(job.name(), true);
                consecutiveFailures = 0;
            } catch (RuntimeException exception) {
                run.setRequestsFailed(run.getRequestsFailed() + 1);
                metrics.recordRequest(job.name(), false);
                errors.add(request, exception);
                if (exception instanceof InvalidSnapshotException) {
                    metrics.recordRejectedSnapshot();
                } else {
                    consecutiveFailures++;
                }
                log.warn("Collector request failed: {}", request.describe(exception));
            }
            saveProgress(run);
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                log.error("Collector job '{}' stopped after {} failed requests in a row", job.name(),
                        consecutiveFailures);
                errors.add(request, new IllegalStateException("Stopped after " + consecutiveFailures
                        + " failed requests in a row"));
                break;
            }
            if (!Pause.sleep(properties.pause())) {
                log.warn("Collector job '{}' was interrupted, remaining requests were skipped", job.name());
                errors.add(request, new IllegalStateException("Interrupted, remaining requests were skipped"));
                interrupted = true;
                break;
            }
        }
        run.setStatus(statusOf(run, interrupted));
        run.setErrorSummary(errors.summary());
        if (run.getRowsSaved() > 0) {
            cacheEviction.evictAll();
        }
        log.info("Collector job '{}' finished: {} rows saved, {} of {} requests failed", job.name(),
                run.getRowsSaved(), run.getRequestsFailed(), run.getRequestsTotal());
    }

    private void saveProgress(CollectorRun run) {
        try {
            runRepository.save(run);
        } catch (RuntimeException exception) {
            log.warn("Progress of collector run {} could not be saved: {}", run.getJobName(), exception.getMessage());
        }
    }

    private CollectorRunStatus statusOf(CollectorRun run, boolean interrupted) {
        if (run.getRequestsFailed() == 0 && !interrupted) {
            return CollectorRunStatus.SUCCESS;
        }
        return run.getRowsSaved() > 0 ? CollectorRunStatus.PARTIAL : CollectorRunStatus.FAILED;
    }
}
