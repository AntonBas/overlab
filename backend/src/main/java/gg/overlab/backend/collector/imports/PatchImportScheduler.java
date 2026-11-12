package gg.overlab.backend.collector.imports;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "collector.patch-import.enabled", havingValue = "true", matchIfMissing = true)
public class PatchImportScheduler {

    private final PatchImportService importService;

    @EventListener(ApplicationReadyEvent.class)
    public void runOnStartup() {
        run();
    }

    @Scheduled(cron = "${collector.patch-import.cron:0 45 3 * * *}")
    public void run() {
        try {
            importService.importNew();
        } catch (RuntimeException exception) {
            log.error("Patch import failed", exception);
        }
    }
}
