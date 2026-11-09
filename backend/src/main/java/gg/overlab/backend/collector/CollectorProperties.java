package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.List;
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

    @AssertTrue(message = "a chained job must follow another configured job, not itself")
    public boolean isChainValid() {
        if (jobs == null) {
            return true;
        }
        return jobs.stream()
                .filter(CollectorJob::isChained)
                .allMatch(job -> !job.after().equals(job.name())
                        && jobs.stream().anyMatch(other -> other.name().equals(job.after())));
    }

    public record Retry(@DefaultValue("3") @Min(1) int maxAttempts, @DefaultValue("5s") @NotNull Duration backoff) {
    }

    public record Timeouts(@DefaultValue("5s") @NotNull Duration connect, @DefaultValue("20s") @NotNull Duration read) {
    }

    public record Retention(@DefaultValue("180") @Min(7) int detailedDays) {
    }
}
