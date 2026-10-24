package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "collector")
public record CollectorProperties(
        @NotBlank String baseUrl,
        @NotBlank String userAgent,
        @NotNull Duration pause,
        @NotNull GameFormat gameFormat,
        String startupJob,
        @NotEmpty List<@Valid CollectorJob> jobs) {
}
