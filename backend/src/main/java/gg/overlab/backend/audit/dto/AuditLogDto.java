package gg.overlab.backend.audit.dto;

import gg.overlab.backend.audit.AuditAction;
import gg.overlab.backend.audit.AuditLog;
import java.time.Instant;
import java.util.Map;

public record AuditLogDto(
        Long id,
        Instant occurredAt,
        Long actorId,
        String actorName,
        String actorRole,
        AuditAction action,
        String entityType,
        String entityId,
        Map<String, Object> changes,
        String ipAddress) {

    public static AuditLogDto from(AuditLog log, Map<Long, String> actorNames) {
        return new AuditLogDto(log.getId(), log.getOccurredAt(), log.getActorId(), actorNames.get(log.getActorId()),
                log.getActorRole(),
                log.getAction(), log.getEntityType(), log.getEntityId(), log.getChanges(), log.getIpAddress());
    }
}
