package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
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

    @PostConstruct
    void registerLastSuccessGauges() {
        for (String counter : List.of("collector.new.heroes", "collector.new.maps", "collector.outliers",
                "collector.rejected.snapshots")) {
            registry.counter(counter);
        }
        registry.counter("collector.suspicious.snapshots", "reason", "pick_rate_sum");
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

    public void recordRejectedSnapshot() {
        registry.counter("collector.rejected.snapshots").increment();
    }

    public void recordNewHero(String slug) {
        registry.counter("collector.new.heroes").increment();
    }

    public void recordNewMap(String slug) {
        registry.counter("collector.new.maps").increment();
    }

    public void recordOutliers(int count) {
        registry.counter("collector.outliers").increment(count);
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

    private double lastSuccessSeconds(CollectorRunRepository repository, String jobName) {
        return repository.findFirstByJobNameAndStatusOrderByFinishedAtDesc(jobName, CollectorRunStatus.SUCCESS)
                .map(run -> (double) run.getFinishedAt().getEpochSecond())
                .orElse(Double.NaN);
    }
}
