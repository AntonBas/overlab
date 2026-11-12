package gg.overlab.backend.collector.imports;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;

class PatchImportSchedulerTest {

    private final PatchImportService importService = mock(PatchImportService.class);
    private final PatchImportScheduler scheduler = new PatchImportScheduler(importService);

    @Test
    void runsTheImportOnStartupAndOnSchedule() {
        scheduler.runOnStartup();
        scheduler.run();

        verify(importService, times(2)).importNew();
    }

    @Test
    void aFailedImportDoesNotStopTheScheduler() {
        when(importService.importNew()).thenThrow(new IllegalStateException("Blizzard page changed"));

        assertThatCode(scheduler::run).doesNotThrowAnyException();
    }
}
