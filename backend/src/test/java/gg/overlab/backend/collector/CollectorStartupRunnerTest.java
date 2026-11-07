package gg.overlab.backend.collector;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class CollectorStartupRunnerTest {

    private final RatesCollectorService collectorService = mock(RatesCollectorService.class);
    private final CollectorRunRepository runRepository = mock(CollectorRunRepository.class);

    private CollectorStartupRunner runner(String startupJob) {
        CollectorProperties properties = new CollectorProperties("https://overwatch.example", "agent",
                Duration.ZERO, null, startupJob, false, false, null, null, 3, null, List.of());
        return new CollectorStartupRunner(properties, collectorService, runRepository);
    }

    @Test
    void marksRunsLeftRunningByAPreviousProcessAsFailed() {
        runner(null).run(null);

        verify(runRepository).failRunningRuns(eq(CollectorRunStatus.RUNNING), eq(CollectorRunStatus.FAILED),
                any(Instant.class), anyString());
        verify(collectorService, never()).runBlocking(anyString(), any(CollectorTrigger.class));
    }

    @Test
    void stillRunsTheConfiguredStartupJob() {
        runner("daily-overview").run(null);

        verify(collectorService).runBlocking("daily-overview", CollectorTrigger.STARTUP);
    }
}
