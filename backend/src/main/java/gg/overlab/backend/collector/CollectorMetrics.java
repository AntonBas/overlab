package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.SnapshotCheckRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CollectorMetrics {

    private static final String JOB_TAG = "collector_job";

    private final MeterRegistry registry;
    private final CollectorRunRepository runRepository;
    private final CollectorProperties properties;
    private final SnapshotCheckRepository checkRepository;

    @PostConstruct
    void registerMeters() {
        for (String counter : List.of("collector.new.heroes", "collector.new.maps", "collector.role.changes",
                "collector.outliers", "collector.rejected.snapshots", "collector.unchanged.snapshots")) {
            registry.counter(counter);
        }
        registry.counter("collector.suspicious.snapshots", "reason", "pick_rate_sum");
        for (GameQueue queue : GameQueue.values()) {
            Gauge.builder("collector.last.change.timestamp.seconds", checkRepository,
                            repository -> lastChangeSeconds(repository, queue))
                    .tag("queue", queue.name())
                    .register(registry);
        }
        for (CollectorJob job : properties.jobs()) {
            Gauge.builder("collector.last.success.timestamp.seconds", runRepository,
                            repository -> lastSuccessSeconds(repository, job.name()))
                    .tag(JOB_TAG, job.name())
                    .register(registry);
        }
    }

    public void recordRequest(String jobName, boolean success) {
        registry.counter("collector.requests", JOB_TAG, jobName, "result", success ? "success" : "failure")
                .increment();
    }

    public void recordUnchangedSnapshot() {
        registry.counter("collector.unchanged.snapshots").increment();
    }

    public void recordRejectedSnapshot() {
        registry.counter("collector.rejected.snapshots").increment();
    }

    public void recordNewHero() {
        registry.counter("collector.new.heroes").increment();
    }

    public void recordNewMap() {
        registry.counter("collector.new.maps").increment();
    }

    public void recordRoleChange() {
        registry.counter("collector.role.changes").increment();
    }

    public void recordOutliers(int count) {
        registry.counter("collector.outliers").increment(count);
    }

    public void recordQuarantinedSnapshot(String reason) {
        registry.counter("collector.quarantined.snapshots", "reason", reason).increment();
    }

    public void recordSuspiciousSnapshot(String reason) {
        registry.counter("collector.suspicious.snapshots", "reason", reason).increment();
    }

    public void recordRun(String jobName, CollectorRunStatus status, int rowsSaved, Duration duration) {
        registry.counter("collector.rows.saved", JOB_TAG, jobName).increment(rowsSaved);
        Timer.builder("collector.job.duration")
                .tag(JOB_TAG, jobName)
                .tag("status", status.name())
                .register(registry)
                .record(duration);
    }

    private double lastChangeSeconds(SnapshotCheckRepository repository, GameQueue queue) {
        return repository.findLatestChange(queue)
                .map(change -> (double) change.getEpochSecond())
                .orElse(Double.NaN);
    }

    private double lastSuccessSeconds(CollectorRunRepository repository, String jobName) {
        return repository.findFirstByJobNameAndStatusOrderByFinishedAtDesc(jobName, CollectorRunStatus.SUCCESS)
                .map(run -> (double) run.getFinishedAt().getEpochSecond())
                .orElse(Double.NaN);
    }
}
