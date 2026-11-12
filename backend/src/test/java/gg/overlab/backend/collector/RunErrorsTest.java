package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import org.junit.jupiter.api.Test;

class RunErrorsTest {

    private SnapshotRequest request(String map) {
        return new SnapshotRequest(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.ALL, map);
    }

    @Test
    void hasNoSummaryWithoutErrors() {
        assertThat(new RunErrors().summary()).isNull();
    }

    @Test
    void keepsOnlyTheFirstThreeDistinctErrors() {
        RunErrors errors = new RunErrors();
        for (int index = 0; index < 5; index++) {
            errors.add(request("map-" + index), new IllegalStateException("boom " + index));
        }
        errors.add(request("map-0"), new IllegalStateException("boom 0"));

        assertThat(errors.summary()).contains("map-0", "map-1", "map-2").doesNotContain("map-3");
        assertThat(errors.summary().split("; ")).hasSize(3);
    }

    @Test
    void truncatesVeryLongText() {
        assertThat(RunErrors.truncate("x".repeat(5000))).hasSize(1000);
        assertThat(RunErrors.truncate("short")).isEqualTo("short");
    }
}
