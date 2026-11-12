package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.scheduling.support.CronExpression;

public record CollectorJob(
        @NotBlank String name,
        String cron,
        @DefaultValue("true") boolean enabled,
        @NotEmpty List<GameQueue> queues,
        @NotEmpty List<Platform> platforms,
        @NotEmpty List<Region> regions,
        @NotEmpty List<RankTier> tiers,
        @NotEmpty List<@NotBlank String> maps,
        @DefaultValue("true") boolean runOnPatch,
        String after,
        Duration minInterval) {

    @AssertTrue(message = "a job needs exactly one trigger: a valid Spring cron expression "
            + "or the name of a job to follow")
    public boolean isTriggerValid() {
        boolean hasCron = cron != null && !cron.isBlank();
        boolean hasParent = after != null && !after.isBlank();
        if (hasCron == hasParent) {
            return false;
        }
        return !hasCron || CronExpression.isValidExpression(cron);
    }

    public boolean isChained() {
        return after != null && !after.isBlank();
    }
}
