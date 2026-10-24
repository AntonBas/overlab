package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.scheduling.support.CronExpression;

public record CollectorJob(
        @NotBlank String name,
        @NotBlank String cron,
        @NotEmpty List<GameQueue> queues,
        @NotEmpty List<Platform> platforms,
        @NotEmpty List<Region> regions,
        @NotEmpty List<RankTier> tiers,
        @NotEmpty List<@NotBlank String> maps) {

    @AssertTrue(message = "cron must be a valid Spring cron expression")
    public boolean isCronValid() {
        return cron != null && CronExpression.isValidExpression(cron);
    }
}
