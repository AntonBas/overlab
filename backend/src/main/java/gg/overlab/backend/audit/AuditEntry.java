package gg.overlab.backend.audit;

import java.time.Instant;
import java.util.Map;

public record AuditEntry(
        Instant occurredAt,
        Long actorId,
        String actorRole,
        AuditAction action,
        String entityType,
        String entityId,
        Map<String, Object> changes,
        String ipAddress) {
}
