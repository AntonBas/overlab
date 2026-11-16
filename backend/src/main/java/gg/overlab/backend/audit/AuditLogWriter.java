package gg.overlab.backend.audit;

import gg.overlab.backend.config.async.AsyncConfig;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
class AuditLogWriter {

    private final AuditLogRepository repository;
    private final MeterRegistry meterRegistry;

    @PostConstruct
    void registerMeters() {
        meterRegistry.counter("audit.write.failed");
    }

    @Async(AsyncConfig.AUDIT_EXECUTOR)
    @Transactional
    public void write(AuditEntry entry) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setOccurredAt(entry.occurredAt());
            auditLog.setActorId(entry.actorId());
            auditLog.setActorRole(entry.actorRole());
            auditLog.setAction(entry.action());
            auditLog.setEntityType(entry.entityType());
            auditLog.setEntityId(entry.entityId());
            auditLog.setChanges(entry.changes());
            auditLog.setIpAddress(entry.ipAddress());
            repository.save(auditLog);
        } catch (RuntimeException exception) {
            meterRegistry.counter("audit.write.failed").increment();
            log.error("Failed to write audit entry {} {} {}: {}", entry.action(), entry.entityType(),
                    entry.entityId(), exception.getMessage());
        }
    }
}
