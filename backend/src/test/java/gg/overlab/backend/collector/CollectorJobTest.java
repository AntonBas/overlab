package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.util.List;
import org.junit.jupiter.api.Test;

class CollectorJobTest {

    private CollectorJob job(String cron, String after) {
        return new CollectorJob("job", cron, true, List.of(GameQueue.COMPETITIVE), List.of(Platform.PC),
                List.of(Region.EUROPE), List.of(RankTier.ALL), List.of("all-maps"), true, after, null);
    }

    @Test
    void aValidCronAloneIsAcceptedAndIsNotChained() {
        CollectorJob job = job("0 0 4 * * *", null);

        assertThat(job.isTriggerValid()).isTrue();
        assertThat(job.isChained()).isFalse();
    }

    @Test
    void aParentJobAloneIsAcceptedAndIsChained() {
        CollectorJob job = job(null, "daily");

        assertThat(job.isTriggerValid()).isTrue();
        assertThat(job.isChained()).isTrue();
    }

    @Test
    void aJobWithoutAnyTriggerIsRejected() {
        assertThat(job(null, null).isTriggerValid()).isFalse();
        assertThat(job(" ", " ").isTriggerValid()).isFalse();
    }

    @Test
    void aJobWithBothTriggersIsRejected() {
        assertThat(job("0 0 4 * * *", "daily").isTriggerValid()).isFalse();
    }

    @Test
    void anInvalidCronExpressionIsRejected() {
        assertThat(job("every day", null).isTriggerValid()).isFalse();
    }
}
