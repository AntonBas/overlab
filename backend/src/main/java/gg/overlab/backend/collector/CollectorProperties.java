package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "collector")
public record CollectorProperties(
        @NotBlank String baseUrl,
        @NotBlank String userAgent,
        @NotNull Duration pause,
        @NotNull GameFormat gameFormat,
        String startupJob,
        @DefaultValue("false") boolean downloadPortraits,
        @DefaultValue("false") boolean importPerks,
        @DefaultValue @Valid Retry retry,
        @DefaultValue @Valid Timeouts timeouts,
        @DefaultValue("30") @Min(1) int minHeroes,
        @DefaultValue @Valid Retention retention,
        @NotEmpty List<@Valid CollectorJob> jobs) {

    @AssertTrue(message = "every chained job must lead back to a scheduled job without loops")
    public boolean isChainValid() {
        if (jobs == null) {
            return true;
        }
        Map<String, CollectorJob> byName = new HashMap<>();
        jobs.forEach(job -> byName.putIfAbsent(job.name(), job));
        return jobs.stream().filter(CollectorJob::isChained).allMatch(job -> leadsToScheduledJob(job, byName));
    }

    private static boolean leadsToScheduledJob(CollectorJob start, Map<String, CollectorJob> byName) {
        Set<String> visited = new HashSet<>();
        CollectorJob current = start;
        while (current.isChained()) {
            if (!visited.add(current.name())) {
                return false;
            }
            current = byName.get(current.after());
            if (current == null) {
                return false;
            }
        }
        return true;
    }

    public record Retry(@DefaultValue("3") @Min(1) int maxAttempts, @DefaultValue("5s") @NotNull Duration backoff) {
    }

    public record Timeouts(@DefaultValue("5s") @NotNull Duration connect, @DefaultValue("20s") @NotNull Duration read) {
    }

    public record Retention(@DefaultValue("180") @Min(7) int detailedDays) {
    }
}
