package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorTrigger;
import gg.overlab.backend.config.async.AsyncConfig;
import java.time.Duration;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
public class PatchCollectionTrigger {

    private final RatesCollectorService collectorService;
    private final PerkImportService perkImportService;
    private final TaskExecutor executor;
    private final Duration recentWindow;

    public PatchCollectionTrigger(RatesCollectorService collectorService, PerkImportService perkImportService,
                                  @Qualifier(AsyncConfig.COLLECTOR_EXECUTOR) TaskExecutor executor,
                                  @Value("${collector.patch-import.recent-days:7}") int recentDays) {
        this.collectorService = collectorService;
        this.perkImportService = perkImportService;
        this.executor = executor;
        this.recentWindow = Duration.ofDays(recentDays);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPatchesImported(PatchesImportedEvent event) {
        Instant threshold = Instant.now().minus(recentWindow);
        boolean freshPatch = event.releaseDates().stream().anyMatch(releasedAt -> releasedAt.isAfter(threshold));
        if (!freshPatch) {
            log.info("Imported patches are older than {}, no full collection started", recentWindow);
            return;
        }
        log.info("A new patch was released, starting a full collection");
        executor.execute(this::collectEverything);
    }

    void collectEverything() {
        for (CollectorJob job : collectorService.jobs()) {
            if (!job.runOnPatch()) {
                continue;
            }
            try {
                collectorService.runBlocking(job.name(), CollectorTrigger.PATCH);
            } catch (RuntimeException exception) {
                log.error("Collector job '{}' failed after a patch", job.name(), exception);
            }
        }
        refreshHeroContent();
    }

    private void refreshHeroContent() {
        try {
            perkImportService.startAsync();
        } catch (RuntimeException exception) {
            log.info("Hero perks and abilities were not refreshed after the patch: {}", exception.getMessage());
        }
    }
}
