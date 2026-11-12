package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.client.BlizzardRatesClient;
import gg.overlab.backend.collector.client.BlizzardRatesResponse;
import gg.overlab.backend.collector.client.RatesFetch;
import gg.overlab.backend.collector.media.HeroAssetService;
import gg.overlab.backend.collector.snapshot.InvalidSnapshotException;
import gg.overlab.backend.collector.snapshot.RatesValidator;
import gg.overlab.backend.collector.snapshot.SnapshotRecorder;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class SnapshotCollectorTest {

    private static final Instant CAPTURED_AT = Instant.parse("2026-11-12T04:00:00Z");

    private final BlizzardRatesClient client = mock(BlizzardRatesClient.class);
    private final RatesValidator validator = mock(RatesValidator.class);
    private final SnapshotRecorder recorder = mock(SnapshotRecorder.class);
    private final HeroAssetService heroAssets = mock(HeroAssetService.class);
    private final CollectorMetrics metrics = mock(CollectorMetrics.class);
    private final SnapshotRequest request = new SnapshotRequest(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE,
            RankTier.ALL, "all-maps");
    private final List<BlizzardRatesResponse.HeroRate> rates = CollectorFixtures.rates(5);

    private SnapshotCollector collector() {
        CollectorProperties properties = new CollectorProperties("https://overwatch.example", "agent",
                Duration.ofMillis(1), GameFormat.FIVE_VS_FIVE, null, false, false, null, null, 3, null, List.of());
        return new SnapshotCollector(properties, client, validator, recorder, heroAssets, metrics);
    }

    private void recorderSaves(int rows, boolean changed) {
        when(validator.withoutEmptyEntries(any())).thenReturn(rates);
        when(recorder.record(any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new SnapshotRecorder.Outcome(rows, changed));
    }

    @Test
    void aNotModifiedAnswerWithAKnownCheckOnlyMarksTheCheck() {
        when(recorder.knownEtag(any(), any(), any(), any(), any())).thenReturn(Optional.of("etag-1"));
        when(client.fetch(any(), any(), any(), any(), any(), eq("etag-1"))).thenReturn(RatesFetch.unchanged());
        when(recorder.markUnchanged(any(), any(), any(), any(), any(), any())).thenReturn(true);

        int rows = collector().collect(CAPTURED_AT, request);

        assertThat(rows).isZero();
        verify(metrics).recordUnchangedSnapshot();
        verify(client, times(1)).fetch(any(), any(), any(), any(), any(), any());
        verify(recorder, never()).record(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void aNotModifiedAnswerWithoutAStoredCheckFetchesTheFullSnapshotAgain() {
        when(recorder.knownEtag(any(), any(), any(), any(), any())).thenReturn(Optional.of("etag-1"));
        when(client.fetch(any(), any(), any(), any(), any(), eq("etag-1"))).thenReturn(RatesFetch.unchanged());
        when(client.fetch(any(), any(), any(), any(), any()))
                .thenReturn(new RatesFetch(rates, "etag-2", false));
        when(recorder.markUnchanged(any(), any(), any(), any(), any(), any())).thenReturn(false);
        recorderSaves(5, true);

        int rows = collector().collect(CAPTURED_AT, request);

        assertThat(rows).isEqualTo(5);
        verify(client).fetch(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.ALL, "all-maps");
        verify(recorder).record(eq(CAPTURED_AT), eq(GameQueue.COMPETITIVE), eq(GameFormat.FIVE_VS_FIVE),
                eq(Platform.PC), eq(Region.EUROPE), eq(RankTier.ALL), eq("all-maps"), eq(rates), eq("etag-2"));
    }

    @Test
    void anInterruptionBeforeTheSecondFetchFailsTheRequest() {
        when(recorder.knownEtag(any(), any(), any(), any(), any())).thenReturn(Optional.of("etag-1"));
        when(client.fetch(any(), any(), any(), any(), any(), eq("etag-1"))).thenReturn(RatesFetch.unchanged());
        when(recorder.markUnchanged(any(), any(), any(), any(), any(), any())).thenReturn(false);
        Thread.currentThread().interrupt();

        try {
            assertThatThrownBy(() -> collector().collect(CAPTURED_AT, request))
                    .isInstanceOf(InvalidSnapshotException.class).hasMessageContaining("Interrupted");
        } finally {
            Thread.interrupted();
        }
        verify(client, never()).fetch(any(), any(), any(), any(), any());
    }

    @Test
    void anUnchangedSnapshotIsCountedAndDoesNotFetchImages() {
        when(client.fetch(any(), any(), any(), any(), any(), any())).thenReturn(new RatesFetch(rates, "e", false));
        recorderSaves(0, false);

        assertThat(collector().collect(CAPTURED_AT, request)).isZero();

        verify(metrics).recordUnchangedSnapshot();
        verify(heroAssets, never()).ensureAssets(anyList());
    }

    @Test
    void aChangedSnapshotEnsuresTheHeroImages() {
        when(client.fetch(any(), any(), any(), any(), any(), any())).thenReturn(new RatesFetch(rates, "e", false));
        recorderSaves(5, true);

        collector().collect(CAPTURED_AT, request);

        verify(heroAssets).ensureAssets(rates);
    }

    @Test
    void aFailureWhileStoringImagesKeepsTheSnapshot() {
        when(client.fetch(any(), any(), any(), any(), any(), any())).thenReturn(new RatesFetch(rates, "e", false));
        recorderSaves(5, true);
        doThrow(new IllegalStateException("disk full")).when(heroAssets).ensureAssets(anyList());

        assertThat(collector().collect(CAPTURED_AT, request)).isEqualTo(5);
    }

    @Test
    void aSnapshotThatFailsValidationIsNeverRecorded() {
        when(client.fetch(any(), any(), any(), any(), any(), any())).thenReturn(new RatesFetch(rates, "e", false));
        doThrow(new InvalidSnapshotException("bad numbers")).when(validator).validate(any());

        assertThatThrownBy(() -> collector().collect(CAPTURED_AT, request))
                .isInstanceOf(InvalidSnapshotException.class);

        verify(recorder, never()).record(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }
}
