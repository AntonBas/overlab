package gg.overlab.backend.collector.run;

import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class CollectorRunRetentionJob {

    private static final Duration RETENTION = Duration.ofDays(90);

    private final CollectorRunRepository repository;

    @Scheduled(cron = "0 50 3 * * *")
    @Transactional
    public int deleteOldRuns() {
        int deleted = repository.deleteFinishedBefore(CollectorRunStatus.RUNNING, Instant.now().minus(RETENTION));
        if (deleted > 0) {
            log.info("Deleted {} collector runs older than {}", deleted, RETENTION);
        }
        return deleted;
    }
}
