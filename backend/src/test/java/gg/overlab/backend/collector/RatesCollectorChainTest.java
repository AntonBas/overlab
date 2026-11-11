package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.SnapshotCheckRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.cache.CacheManager;

class RatesCollectorChainTest {

    private final BlizzardRatesClient client = mock(BlizzardRatesClient.class);
    private final SnapshotRecorder recorder = mock(SnapshotRecorder.class);
    private final CollectorRunRepository runRepository = mock(CollectorRunRepository.class);
    private final CollectorJob parent = CollectorFixtures.job("overview", List.of(GameQueue.COMPETITIVE),
            List.of(RankTier.ALL), List.of("all-maps"));
    private final CollectorJob child = CollectorFixtures.chainedJob("maps", "overview", Duration.ofDays(2));

    private RatesCollectorService service;

    @BeforeEach
    void setUp() {
        CollectorProperties properties = CollectorFixtures.properties(1, parent, child);
        CollectorMetrics metrics = new CollectorMetrics(new SimpleMeterRegistry(), runRepository, properties,
                mock(SnapshotCheckRepository.class));
        metrics.registerLastSuccessGauges();
        service = new RatesCollectorService(properties, client, mock(RatesValidator.class), recorder,
                mock(GameMapRepository.class), mock(MapDiscoveryService.class), mock(CacheManager.class), runRepository, metrics, Runnable::run);
        when(runRepository.save(any(CollectorRun.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(client.fetch(any(), any(), any(), any(), any(), any()))
                .thenReturn(new RatesFetch(CollectorFixtures.rates(5), "etag", false));
        when(runRepository.findFirstByJobNameAndStatusOrderByFinishedAtDesc(any(), any()))
                .thenReturn(Optional.empty());
    }

    private void recorderSaves(int rows) {
        when(recorder.record(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new SnapshotRecorder.Outcome(rows, rows > 0));
    }

    private void childRanSuccessfully(Duration ago) {
        CollectorRun previous = new CollectorRun();
        previous.setFinishedAt(Instant.now().minus(ago));
        previous.setStatus(CollectorRunStatus.SUCCESS);
        when(runRepository.findFirstByJobNameAndStatusOrderByFinishedAtDesc("maps", CollectorRunStatus.SUCCESS))
                .thenReturn(Optional.of(previous));
    }

    private List<CollectorRun> savedRuns() {
        ArgumentCaptor<CollectorRun> captor = ArgumentCaptor.forClass(CollectorRun.class);
        verify(runRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        List<CollectorRun> distinct = new ArrayList<>();
        captor.getAllValues().forEach(run -> {
            if (!distinct.contains(run)) {
                distinct.add(run);
            }
        });
        return distinct;
    }

    @Test
    void startsDependentJobWhenParentSavedRows() {
        recorderSaves(5);

        service.runInline("overview", CollectorTrigger.SCHEDULED);

        assertThat(savedRuns()).extracting(CollectorRun::getJobName).containsExactly("overview", "maps");
        assertThat(savedRuns().get(1).getTrigger()).isEqualTo(CollectorTrigger.CHAINED);
    }

    @Test
    void skipsDependentJobWhenNothingChanged() {
        recorderSaves(0);

        service.runInline("overview", CollectorTrigger.SCHEDULED);

        assertThat(savedRuns()).extracting(CollectorRun::getJobName).containsExactly("overview");
    }

    @Test
    void skipsDependentJobWhenItRanWithinTheMinimumInterval() {
        recorderSaves(5);
        childRanSuccessfully(Duration.ofHours(10));

        service.runInline("overview", CollectorTrigger.SCHEDULED);

        assertThat(savedRuns()).extracting(CollectorRun::getJobName).containsExactly("overview");
    }

    @Test
    void startsDependentJobWhenTheMinimumIntervalHasPassed() {
        recorderSaves(5);
        childRanSuccessfully(Duration.ofDays(3));

        service.runInline("overview", CollectorTrigger.SCHEDULED);

        assertThat(savedRuns()).extracting(CollectorRun::getJobName).containsExactly("overview", "maps");
    }

    @Test
    void doesNotChainAfterAPatchRun() {
        recorderSaves(5);

        service.runInline("overview", CollectorTrigger.PATCH);

        assertThat(savedRuns()).extracting(CollectorRun::getJobName).containsExactly("overview");
    }
}
