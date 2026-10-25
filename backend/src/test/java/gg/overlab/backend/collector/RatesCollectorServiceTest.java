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

import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunDto;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.cache.CacheManager;
import org.springframework.core.task.TaskExecutor;

class RatesCollectorServiceTest {

    private final BlizzardRatesClient client = mock(BlizzardRatesClient.class);
    private final RatesValidator validator = mock(RatesValidator.class);
    private final RatesSnapshotWriter writer = mock(RatesSnapshotWriter.class);
    private final CollectorRunRepository runRepository = mock(CollectorRunRepository.class);
    private final SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
    private final List<Runnable> queuedTasks = new ArrayList<>();
    private final TaskExecutor deferredExecutor = queuedTasks::add;

    private final CollectorJob job = CollectorFixtures.job("daily", List.of(GameQueue.QUICK_PLAY, GameQueue.COMPETITIVE),
            List.of(RankTier.ALL, RankTier.GOLD), List.of("all-maps"));

    private RatesCollectorService service;

    @BeforeEach
    void setUp() {
        CollectorProperties properties = CollectorFixtures.properties(1, job);
        service = new RatesCollectorService(properties, client, validator, writer, mock(GameMapRepository.class),
                mock(CacheManager.class), runRepository, new CollectorMetrics(meterRegistry), deferredExecutor);
        when(runRepository.save(any(CollectorRun.class))).thenAnswer(invocation -> {
            CollectorRun run = invocation.getArgument(0);
            if (run.getId() == null) {
                run.setId(7L);
            }
            return run;
        });
        when(client.fetch(any(), any(), any(), any(), any())).thenReturn(CollectorFixtures.rates(5));
        when(writer.save(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(5);
    }

    @Test
    void successfulRunRecordsCountsAndMetrics() {
        service.runBlocking("daily", CollectorTrigger.SCHEDULED);

        CollectorRun run = lastSavedRun();
        assertThat(run.getStatus()).isEqualTo(CollectorRunStatus.SUCCESS);
        assertThat(run.getRequestsTotal()).isEqualTo(3);
        assertThat(run.getRequestsFailed()).isZero();
        assertThat(run.getRowsSaved()).isEqualTo(15);
        assertThat(run.getFinishedAt()).isNotNull();
        assertThat(run.getErrorSummary()).isNull();
        assertThat(meterRegistry.get("collector.requests").tag("result", "success").counter().count()).isEqualTo(3.0);
        assertThat(meterRegistry.get("collector.rows.saved").counter().count()).isEqualTo(15.0);
        assertThat(meterRegistry.get("collector.last.success.timestamp.seconds").gauge().value()).isPositive();
    }

    @Test
    void quickPlayIsRequestedOnlyForTierAll() {
        service.runBlocking("daily", CollectorTrigger.SCHEDULED);

        verify(client).fetch(GameQueue.QUICK_PLAY, Platform.PC, Region.EUROPE, RankTier.ALL, "all-maps");
        verify(client, times(0)).fetch(GameQueue.QUICK_PLAY, Platform.PC, Region.EUROPE, RankTier.GOLD, "all-maps");
        verify(client).fetch(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.GOLD, "all-maps");
        verify(writer, times(3)).save(any(), any(), eq(GameFormat.FIVE_VS_FIVE), any(), any(), any(), any(), any());
    }

    @Test
    void invalidSnapshotIsNotSavedAndRunIsPartial() {
        doThrow(new InvalidSnapshotException("bad numbers")).doNothing().when(validator).validate(any());

        service.runBlocking("daily", CollectorTrigger.SCHEDULED);

        CollectorRun run = lastSavedRun();
        assertThat(run.getStatus()).isEqualTo(CollectorRunStatus.PARTIAL);
        assertThat(run.getRequestsFailed()).isEqualTo(1);
        assertThat(run.getRowsSaved()).isEqualTo(10);
        assertThat(run.getErrorSummary()).contains("bad numbers");
        verify(writer, times(2)).save(any(), any(), any(), any(), any(), any(), any(), any());
        assertThat(meterRegistry.get("collector.requests").tag("result", "failure").counter().count()).isEqualTo(1.0);
    }

    @Test
    void runWhereEveryRequestFailsIsFailedAndNotCountedAsSuccess() {
        when(client.fetch(any(), any(), any(), any(), any())).thenThrow(new IllegalStateException("blizzard down"));

        service.runBlocking("daily", CollectorTrigger.SCHEDULED);

        CollectorRun run = lastSavedRun();
        assertThat(run.getStatus()).isEqualTo(CollectorRunStatus.FAILED);
        assertThat(run.getRowsSaved()).isZero();
        assertThat(run.getErrorSummary()).contains("blizzard down");
        assertThat(meterRegistry.find("collector.last.success.timestamp.seconds").gauge()).isNull();
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

        service.runBlocking("daily", CollectorTrigger.SCHEDULED);

        verify(client, times(0)).fetch(any(), any(), any(), any(), any());
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
