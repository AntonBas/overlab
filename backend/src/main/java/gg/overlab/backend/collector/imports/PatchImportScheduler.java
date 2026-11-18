package gg.overlab.backend.collector.imports;

import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "collector.patch-import.enabled", havingValue = "true", matchIfMissing = true)
public class PatchImportScheduler {

    private final PatchImportService importService;
    private final Duration startupStaleAfter;

    public PatchImportScheduler(PatchImportService importService,
                                @Value("${collector.patch-import.startup-stale-after:7d}") Duration startupStaleAfter) {
        this.importService = importService;
        this.startupStaleAfter = startupStaleAfter;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void runOnStartup() {
        if (importService.isStale(startupStaleAfter)) {
            start();
        }
    }

    @Scheduled(cron = "${collector.patch-import.cron:0 45 3 * * *}")
    public void run() {
        start();
    }

    private void start() {
        try {
            importService.startAsync();
        } catch (RuntimeException exception) {
            log.warn("Patch import was not started: {}", exception.getMessage());
        }
    }
}
