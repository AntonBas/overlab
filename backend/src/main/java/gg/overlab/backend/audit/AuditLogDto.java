package gg.overlab.backend.audit;

import java.time.Instant;
import java.util.Map;

public record AuditLogDto(
        Long id,
        Instant occurredAt,
        Long actorId,
        String actorRole,
        AuditAction action,
        String entityType,
        String entityId,
        Map<String, Object> changes,
        String ipAddress) {

    static AuditLogDto from(AuditLog log) {
        return new AuditLogDto(log.getId(), log.getOccurredAt(), log.getActorId(), log.getActorRole(),
                log.getAction(), log.getEntityType(), log.getEntityId(), log.getChanges(), log.getIpAddress());
    }
}
