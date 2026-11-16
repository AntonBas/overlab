package gg.overlab.backend.collector.imports;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.exception.core.ConflictException;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class PatchImportSchedulerTest {

    private final PatchImportService importService = mock(PatchImportService.class);
    private final PatchImportScheduler scheduler = new PatchImportScheduler(importService, Duration.ofDays(7));

    @Test
    void startupImportRunsOnlyWhenThePatchDataIsStale() {
        when(importService.isStale(any(Duration.class))).thenReturn(false, true);

        scheduler.runOnStartup();
        verify(importService, never()).startAsync();

        scheduler.runOnStartup();
        verify(importService, times(1)).startAsync();
    }

    @Test
    void scheduledRunStartsTheBackgroundImport() {
        scheduler.run();

        verify(importService).startAsync();
    }

    @Test
    void aRejectedStartDoesNotStopTheScheduler() {
        doThrow(new ConflictException("already running")).when(importService).startAsync();

        assertThatCode(scheduler::run).doesNotThrowAnyException();
    }
}
