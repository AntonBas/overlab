package gg.overlab.backend.audit;

import gg.overlab.backend.config.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogWriter writer;

    public void logCreate(String entityType, Object entityId, Record snapshot) {
        submit(AuditAction.CREATE, entityType, entityId, AuditSnapshots.of(snapshot), currentActor());
    }

    public void logUpdate(String entityType, Object entityId, Record before, Record after) {
        Map<String, Object> changes = AuditSnapshots.diff(AuditSnapshots.of(before), AuditSnapshots.of(after));
        if (!changes.isEmpty()) {
            submit(AuditAction.UPDATE, entityType, entityId, changes, currentActor());
        }
    }

    public void logDelete(String entityType, Object entityId, Record snapshot) {
        submit(AuditAction.DELETE, entityType, entityId, AuditSnapshots.of(snapshot), currentActor());
    }

    public void logUserEvent(AuditAction action, Long userId, String role) {
        submit(action, "User", userId, null, new Actor(userId, role));
    }

    private void submit(AuditAction action, String entityType, Object entityId, Map<String, Object> changes,
                        Actor actor) {
        AuditEntry entry = new AuditEntry(Instant.now(), actor.id(), actor.role(), action, entityType,
                entityId == null ? null : String.valueOf(entityId), changes, clientIp());
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    writer.write(entry);
                }
            });
        } else {
            writer.write(entry);
        }
    }

    private Actor currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return new Actor(user.id(), user.role().name());
        }
        return new Actor(null, "SYSTEM");
    }

    private String clientIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            return request.getRemoteAddr();
        }
        return null;
    }

    private record Actor(Long id, String role) {
    }
}
