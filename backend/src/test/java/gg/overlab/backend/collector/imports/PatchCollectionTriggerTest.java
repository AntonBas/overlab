package gg.overlab.backend.collector.imports;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.CollectorJob;
import gg.overlab.backend.collector.RatesCollectorService;
import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.RankTier;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.Test;

class PatchCollectionTriggerTest {

    private final RatesCollectorService collectorService = mock(RatesCollectorService.class);
    private final HeroContentImportService perkImportService = mock(HeroContentImportService.class);
    private final PatchCollectionTrigger trigger =
            new PatchCollectionTrigger(collectorService, perkImportService, Runnable::run, 7);

    private CollectorJob job(String name, boolean runOnPatch) {
        return new CollectorJob(name, "0 0 4 * * *", false, List.of(GameQueue.COMPETITIVE), List.of(Platform.PC),
                List.of(Region.EUROPE), List.of(RankTier.ALL), List.of("all-maps"), runOnPatch, null, null);
    }

    @Test
    void runsEveryPatchJobAfterAFreshPatchEvenWhenTheScheduleIsOff() {
        when(collectorService.jobs()).thenReturn(List.of(job("overview", true), job("console", true),
                job("manual-only", false)));

        trigger.onPatchesImported(new PatchesImportedEvent(List.of(Instant.now().minus(1, ChronoUnit.DAYS))));

        verify(collectorService).runInline("overview", CollectorTrigger.PATCH);
        verify(collectorService).runInline("console", CollectorTrigger.PATCH);
        verify(collectorService, never()).runInline("manual-only", CollectorTrigger.PATCH);
        verify(perkImportService).startAsync();
    }

    @Test
    void keepsGoingWhenTheHeroContentImportCannotStart() {
        when(collectorService.jobs()).thenReturn(List.of(job("overview", true)));
        when(perkImportService.startAsync()).thenThrow(new IllegalStateException("disabled"));

        trigger.onPatchesImported(new PatchesImportedEvent(List.of(Instant.now().minus(1, ChronoUnit.DAYS))));

        verify(collectorService).runInline("overview", CollectorTrigger.PATCH);
    }

    @Test
    void ignoresOldPatchesImportedOnAFreshInstall() {
        when(collectorService.jobs()).thenReturn(List.of(job("overview", true)));

        trigger.onPatchesImported(new PatchesImportedEvent(List.of(Instant.now().minus(60, ChronoUnit.DAYS))));

        verify(collectorService, never()).runInline("overview", CollectorTrigger.PATCH);
        verify(perkImportService, never()).startAsync();
    }
}
