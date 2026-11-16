package gg.overlab.backend.audit;

import gg.overlab.backend.common.ScheduledJobLock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditRetentionJob {

    private final AuditLogRepository repository;
    private final AuditProperties properties;
    private final ScheduledJobLock jobLock;

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void deleteOldUserEvents() {
        jobLock.runExclusively("audit-retention", this::deleteUserEventsAndIpAddresses);
    }

    private void deleteUserEventsAndIpAddresses() {
        int deleted = repository.deleteByEntityTypeBefore(AuditEntityType.USER,
                Instant.now().minus(properties.userEventRetention()));
        if (deleted > 0) {
            log.info("Deleted {} user audit entries older than {}", deleted, properties.userEventRetention());
        }
        int cleared = repository.clearIpAddressesBefore(Instant.now().minus(properties.userEventRetention()));
        if (cleared > 0) {
            log.info("Cleared the IP address of {} audit entries older than {}", cleared,
                    properties.userEventRetention());
        }
    }
}
