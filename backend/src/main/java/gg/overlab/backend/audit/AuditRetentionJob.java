package gg.overlab.backend.audit;

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

    private static final String USER_ENTITY_TYPE = "User";

    private final AuditLogRepository repository;
    private final AuditProperties properties;

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void deleteOldUserEvents() {
        int deleted = repository.deleteByEntityTypeBefore(USER_ENTITY_TYPE,
                Instant.now().minus(properties.userEventRetention()));
        if (deleted > 0) {
            log.info("Deleted {} user audit entries older than {}", deleted, properties.userEventRetention());
        }
    }
}
