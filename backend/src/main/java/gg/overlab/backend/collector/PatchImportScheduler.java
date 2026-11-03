package gg.overlab.backend.collector;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "collector.patch-import.enabled", havingValue = "true", matchIfMissing = true)
public class PatchImportScheduler {

    private final PatchImportService importService;

    @Scheduled(cron = "${collector.patch-import.cron:0 15 6 * * *}")
    public void run() {
        try {
            importService.importNew();
        } catch (RuntimeException exception) {
            log.error("Patch import failed", exception);
        }
    }
}
