package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.client.BlizzardRatesClient;
import gg.overlab.backend.collector.client.RatesFetch;
import gg.overlab.backend.collector.dto.CollectorRunDto;
import gg.overlab.backend.collector.imports.MapDiscoveryService;
import gg.overlab.backend.collector.media.HeroAssetService;
import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.collector.snapshot.InvalidSnapshotException;
import gg.overlab.backend.collector.snapshot.RatesValidator;
import gg.overlab.backend.collector.snapshot.SnapshotRecorder;
import gg.overlab.backend.config.cache.CacheEviction;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.SnapshotCheckRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;

class RatesCollectorServiceTest {

    private final BlizzardRatesClient client = mock(BlizzardRatesClient.class);
    private final RatesValidator validator = mock(RatesValidator.class);
    private final SnapshotRecorder recorder = mock(SnapshotRecorder.class);
    private final CollectorRunRepository runRepository = mock(CollectorRunRepository.class);
    private final SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
    private final List<Runnable> queuedTasks = new ArrayList<>();
    private final TaskExecutor deferredExecutor = queuedTasks::add;

    private final CollectorJob job = CollectorFixtures.job("daily", List.of(GameQueue.QUICK_PLAY, GameQueue.COMPETITIVE),
            List.of(RankTier.ALL, RankTier.GOLD), List.of("all-maps"));

    private CollectorMetrics metrics;
    private RatesCollectorService service;

    @BeforeEach
    void setUp() {
        CollectorProperties properties = CollectorFixtures.properties(1, job);
        metrics = new CollectorMetrics(meterRegistry, runRepository, properties, mock(SnapshotCheckRepository.class));
        metrics.registerMeters();
        service = new RatesCollectorService(properties, client, validator, recorder, mock(GameMapRepository.class),
                mock(MapDiscoveryService.class), mock(HeroAssetService.class), mock(CacheEviction.class), runRepository, metrics, deferredExecutor);
        when(runRepository.save(any(CollectorRun.class))).thenAnswer(invocation -> {
            CollectorRun run = invocation.getArgument(0);
            if (run.getId() == null) {
                run.setId(7L);
            }
            return run;
        });
        when(client.fetch(any(), any(), any(), any(), any(), any()))
                .thenReturn(new RatesFetch(CollectorFixtures.rates(5), "etag-1", false));
        when(recorder.record(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new SnapshotRecorder.Outcome(5, true));
    }

    @Test
    void successfulRunRecordsCountsAndMetrics() {
        service.runInline("daily", CollectorTrigger.SCHEDULED);

        CollectorRun run = lastSavedRun();
        assertThat(run.getStatus()).isEqualTo(CollectorRunStatus.SUCCESS);
        assertThat(run.getRequestsTotal()).isEqualTo(3);
        assertThat(run.getRequestsFailed()).isZero();
        assertThat(run.getRowsSaved()).isEqualTo(15);
        assertThat(run.getFinishedAt()).isNotNull();
        assertThat(run.getErrorSummary()).isNull();
        assertThat(meterRegistry.get("collector.requests").tag("result", "success").counter().count()).isEqualTo(3.0);
        assertThat(meterRegistry.get("collector.rows.saved").counter().count()).isEqualTo(15.0);
    }

    @Test
    void unchangedSnapshotsAreCountedAndSaveNoRows() {
        when(recorder.record(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new SnapshotRecorder.Outcome(0, false));

        service.runInline("daily", CollectorTrigger.SCHEDULED);

        CollectorRun run = lastSavedRun();
        assertThat(run.getRowsSaved()).isZero();
        assertThat(run.getStatus()).isEqualTo(CollectorRunStatus.SUCCESS);
        assertThat(meterRegistry.get("collector.unchanged.snapshots").counter().count()).isEqualTo(3.0);
    }

    @Test
    void aNotModifiedAnswerSkipsValidationAndStorage() {
        when(recorder.knownEtag(any(), any(), any(), any(), any())).thenReturn(Optional.of("etag-1"));
        when(client.fetch(any(), any(), any(), any(), any(), eq("etag-1"))).thenReturn(RatesFetch.unchanged());
        when(recorder.markUnchanged(any(), any(), any(), any(), any(), any())).thenReturn(true);

        service.runInline("daily", CollectorTrigger.SCHEDULED);

        verify(validator, times(0)).validate(any());
        verify(recorder, times(0)).record(any(), any(), any(), any(), any(), any(), any(), any(), any());
        assertThat(lastSavedRun().getRowsSaved()).isZero();
        assertThat(meterRegistry.get("collector.unchanged.snapshots").counter().count()).isEqualTo(3.0);
    }

    @Test
    void lastSuccessGaugeIsReadFromTheRunHistory() {
        CollectorRun success = new CollectorRun();
        success.setFinishedAt(Instant.parse("2026-10-25T04:01:00Z"));
        when(runRepository.findFirstByJobNameAndStatusOrderByFinishedAtDesc("daily", CollectorRunStatus.SUCCESS))
                .thenReturn(Optional.of(success));

        assertThat(meterRegistry.get("collector.last.success.timestamp.seconds").tag("collector_job", "daily").gauge()
                .value()).isEqualTo((double) success.getFinishedAt().getEpochSecond());
    }

    @Test
    void lastSuccessGaugeIsNotANumberBeforeAnySuccessfulRun() {
        assertThat(meterRegistry.get("collector.last.success.timestamp.seconds").gauge().value()).isNaN();
    }

    @Test
    void quickPlayIsRequestedOnlyForTierAll() {
        service.runInline("daily", CollectorTrigger.SCHEDULED);

        verify(client).fetch(GameQueue.QUICK_PLAY, Platform.PC, Region.EUROPE, RankTier.ALL, "all-maps", null);
        verify(client, times(0)).fetch(GameQueue.QUICK_PLAY, Platform.PC, Region.EUROPE, RankTier.GOLD, "all-maps", null);
        verify(client).fetch(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.GOLD, "all-maps", null);
        verify(recorder, times(3)).record(any(), any(), eq(GameFormat.FIVE_VS_FIVE), any(), any(), any(), any(), any(),
                any());
    }

    @Test
    void invalidSnapshotIsNotSavedAndRunIsPartial() {
        doThrow(new InvalidSnapshotException("bad numbers")).doNothing().when(validator).validate(any());

        service.runInline("daily", CollectorTrigger.SCHEDULED);

        CollectorRun run = lastSavedRun();
        assertThat(run.getStatus()).isEqualTo(CollectorRunStatus.PARTIAL);
        assertThat(run.getRequestsFailed()).isEqualTo(1);
        assertThat(run.getRowsSaved()).isEqualTo(10);
        assertThat(run.getErrorSummary()).contains("bad numbers");
        verify(recorder, times(2)).record(any(), any(), any(), any(), any(), any(), any(), any(), any());
        assertThat(meterRegistry.get("collector.requests").tag("result", "failure").counter().count()).isEqualTo(1.0);
    }

    @Test
    void runWhereEveryRequestFailsIsFailedAndNotCountedAsSuccess() {
        when(client.fetch(any(), any(), any(), any(), any(), any())).thenThrow(new IllegalStateException("blizzard down"));

        service.runInline("daily", CollectorTrigger.SCHEDULED);

        CollectorRun run = lastSavedRun();
        assertThat(run.getStatus()).isEqualTo(CollectorRunStatus.FAILED);
        assertThat(run.getRowsSaved()).isZero();
        assertThat(run.getErrorSummary()).contains("blizzard down");
    }

    @Test
    void manualRunReturnsRunningRecordAndFinishesLater() {
        CollectorRunDto started = service.startAsync("daily", CollectorTrigger.MANUAL);

        assertThat(started.id()).isEqualTo(7L);
        assertThat(started.status()).isEqualTo(CollectorRunStatus.RUNNING);
        assertThat(started.trigger()).isEqualTo(CollectorTrigger.MANUAL);
        assertThat(queuedTasks).hasSize(1);

        queuedTasks.get(0).run();

        assertThat(lastSavedRun().getStatus()).isEqualTo(CollectorRunStatus.SUCCESS);
    }

    @Test
    void secondRunOfTheSameJobIsRejectedWhileFirstIsRunning() {
        service.startAsync("daily", CollectorTrigger.MANUAL);

        assertThatThrownBy(() -> service.startAsync("daily", CollectorTrigger.MANUAL))
                .isInstanceOf(ConflictException.class);

        queuedTasks.get(0).run();
        assertThat(service.startAsync("daily", CollectorTrigger.MANUAL).id()).isEqualTo(7L);
    }

    @Test
    void scheduledRunIsSkippedWhileJobIsRunning() {
        service.startAsync("daily", CollectorTrigger.MANUAL);

        service.runInline("daily", CollectorTrigger.SCHEDULED);

        verify(client, times(0)).fetch(any(), any(), any(), any(), any(), any());
    }

    @Test
    void rejectedExecutionFailsTheRunAndFreesTheJob() {
        TaskExecutor rejectingExecutor = task -> {
            throw new TaskRejectedException("queue is full");
        };
        RatesCollectorService rejecting = new RatesCollectorService(
                CollectorFixtures.properties(1, job), client, validator, recorder, mock(GameMapRepository.class), mock(MapDiscoveryService.class), mock(HeroAssetService.class), mock(CacheEviction.class),
                runRepository, metrics, rejectingExecutor);

        assertThatThrownBy(() -> rejecting.startAsync("daily", CollectorTrigger.MANUAL))
                .isInstanceOf(ConflictException.class);

        assertThat(lastSavedRun().getStatus()).isEqualTo(CollectorRunStatus.FAILED);
        assertThatThrownBy(() -> rejecting.startAsync("daily", CollectorTrigger.MANUAL))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("queue is full");
    }

    @Test
    void startIfPossibleSkipsQuietlyWhileJobIsRunning() {
        service.startAsync("daily", CollectorTrigger.MANUAL);

        service.startIfPossible("daily", CollectorTrigger.SCHEDULED);

        assertThat(queuedTasks).hasSize(1);
    }

    @Test
    void unknownJobIsNotFound() {
        assertThatThrownBy(() -> service.startAsync("missing", CollectorTrigger.MANUAL))
                .isInstanceOf(EntityNotFoundException.class);
    }

    private CollectorRun lastSavedRun() {
        ArgumentCaptor<CollectorRun> captor = ArgumentCaptor.forClass(CollectorRun.class);
        verify(runRepository, atLeastOnce()).save(captor.capture());
        return captor.getAllValues().get(captor.getAllValues().size() - 1);
    }
}
