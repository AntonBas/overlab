package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorRunStatus;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CollectorMetrics {

    private static final String JOB_TAG = "collector_job";

    private final MeterRegistry registry;
    private final Map<String, AtomicLong> lastSuccess = new ConcurrentHashMap<>();

    public void recordRequest(String jobName, boolean success) {
        registry.counter("collector.requests", JOB_TAG, jobName, "result", success ? "success" : "failure")
                .increment();
    }

    public void recordRun(String jobName, CollectorRunStatus status, int rowsSaved, Duration duration) {
        registry.counter("collector.rows.saved", JOB_TAG, jobName).increment(rowsSaved);
        Timer.builder("collector.job.duration")
                .tag(JOB_TAG, jobName)
                .tag("status", status.name())
                .register(registry)
                .record(duration);
        if (status == CollectorRunStatus.SUCCESS) {
            AtomicLong holder = lastSuccess.computeIfAbsent(jobName, name -> {
                AtomicLong value = new AtomicLong();
                Gauge.builder("collector.last.success.timestamp.seconds", value, AtomicLong::get)
                        .tag(JOB_TAG, name)
                        .register(registry);
                return value;
            });
            holder.set(Instant.now().getEpochSecond());
        }
    }
}
