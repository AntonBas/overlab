package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.RankTier;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class JobChainTest {

    private final CollectorRunRepository runRepository = mock(CollectorRunRepository.class);
    private final CollectorJob parent = CollectorFixtures.job("overview", List.of(GameQueue.COMPETITIVE),
            List.of(RankTier.ALL), List.of("all-maps"));
    private final CollectorJob child = CollectorFixtures.chainedJob("maps", "overview", Duration.ofDays(2));
    private final JobChain chain = new JobChain(CollectorFixtures.properties(1, parent, child), runRepository);

    private CollectorRun run(CollectorTrigger trigger, CollectorRunStatus status, int rows) {
        CollectorRun run = new CollectorRun();
        run.setTrigger(trigger);
        run.setStatus(status);
        run.setRowsSaved(rows);
        return run;
    }

    private void lastSuccess(Instant finishedAt) {
        CollectorRun previous = new CollectorRun();
        previous.setFinishedAt(finishedAt);
        when(runRepository.findFirstByJobNameAndStatusOrderByFinishedAtDesc(eq("maps"), any()))
                .thenReturn(Optional.of(previous));
    }

    @Test
    void startsDependentsWhenTheParentSavedRowsAndTheIntervalPassed() {
        lastSuccess(Instant.now().minus(Duration.ofDays(3)));

        assertThat(chain.dependentsToRun(parent, run(CollectorTrigger.SCHEDULED, CollectorRunStatus.SUCCESS, 10)))
                .containsExactly(child);
    }

    @Test
    void waitsUntilTheMinimumIntervalHasPassed() {
        lastSuccess(Instant.now().minus(Duration.ofHours(5)));

        assertThat(chain.dependentsToRun(parent, run(CollectorTrigger.SCHEDULED, CollectorRunStatus.SUCCESS, 10)))
                .isEmpty();
    }

    @Test
    void startsWhenTheDependentNeverSucceededBefore() {
        when(runRepository.findFirstByJobNameAndStatusOrderByFinishedAtDesc(any(), any()))
                .thenReturn(Optional.empty());

        assertThat(chain.dependentsToRun(parent, run(CollectorTrigger.MANUAL, CollectorRunStatus.PARTIAL, 1)))
                .containsExactly(child);
    }

    @Test
    void startsNothingForPatchRunsFailuresOrEmptyRuns() {
        assertThat(chain.dependentsToRun(parent, run(CollectorTrigger.PATCH, CollectorRunStatus.SUCCESS, 10)))
                .isEmpty();
        assertThat(chain.dependentsToRun(parent, run(CollectorTrigger.SCHEDULED, CollectorRunStatus.FAILED, 10)))
                .isEmpty();
        assertThat(chain.dependentsToRun(parent, run(CollectorTrigger.SCHEDULED, CollectorRunStatus.SUCCESS, 0)))
                .isEmpty();
    }
}
