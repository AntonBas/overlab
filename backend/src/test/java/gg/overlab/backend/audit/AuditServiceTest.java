package gg.overlab.backend.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.user.UserRole;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class AuditServiceTest {

    private record Perk(Long id, String name, String recommendation) {
    }

    private final AuditLogWriter writer = mock(AuditLogWriter.class);
    private final AuditService service = new AuditService(writer);

    @AfterEach
    void cleanUp() {
        SecurityContextHolder.clearContext();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void recordsAdminActorFromSecurityContext() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(9L, "admin@overlab.gg", UserRole.ADMIN), null, List.of()));

        service.logCreate("Perk", 5L, new Perk(5L, "Quick Sleep", "RECOMMENDED"));

        AuditEntry entry = captureEntry();
        assertThat(entry.actorId()).isEqualTo(9L);
        assertThat(entry.actorRole()).isEqualTo("ADMIN");
        assertThat(entry.action()).isEqualTo(AuditAction.CREATE);
        assertThat(entry.entityType()).isEqualTo("Perk");
        assertThat(entry.entityId()).isEqualTo("5");
        assertThat(entry.changes()).containsEntry("name", "Quick Sleep");
    }

    @Test
    void recordsSystemActorWithoutAuthentication() {
        service.logDelete("Perk", 5L, new Perk(5L, "Quick Sleep", "AVOID"));

        AuditEntry entry = captureEntry();
        assertThat(entry.actorId()).isNull();
        assertThat(entry.actorRole()).isEqualTo("SYSTEM");
        assertThat(entry.action()).isEqualTo(AuditAction.DELETE);
    }

    @Test
    void updateStoresOnlyChangedFields() {
        service.logUpdate("Perk", 5L, new Perk(5L, "Quick Sleep", "RECOMMENDED"), new Perk(5L, "Quick Sleep", "AVOID"));

        AuditEntry entry = captureEntry();
        assertThat(entry.action()).isEqualTo(AuditAction.UPDATE);
        assertThat(entry.changes()).containsOnlyKeys("recommendation");
    }

    @Test
    void updateWithoutChangesWritesNothing() {
        Perk perk = new Perk(5L, "Quick Sleep", "RECOMMENDED");

        service.logUpdate("Perk", 5L, perk, perk);

        verify(writer, never()).write(any());
    }

    @Test
    void userEventUsesGivenUserAndStoresNoChanges() {
        service.logUserEvent(AuditAction.LOGIN, 12L, "USER");

        AuditEntry entry = captureEntry();
        assertThat(entry.actorId()).isEqualTo(12L);
        assertThat(entry.actorRole()).isEqualTo("USER");
        assertThat(entry.entityType()).isEqualTo("User");
        assertThat(entry.entityId()).isEqualTo("12");
        assertThat(entry.changes()).isNull();
    }

    @Test
    void writesOnlyAfterTransactionCommit() {
        TransactionSynchronizationManager.initSynchronization();

        service.logCreate("Perk", 5L, new Perk(5L, "Quick Sleep", "RECOMMENDED"));
        verify(writer, never()).write(any());

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(writer).write(any());
    }

    @Test
    void neverWritesWhenTransactionRollsBack() {
        TransactionSynchronizationManager.initSynchronization();

        service.logCreate("Perk", 5L, new Perk(5L, "Quick Sleep", "RECOMMENDED"));
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(synchronization -> synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        verify(writer, never()).write(any());
    }

    private AuditEntry captureEntry() {
        ArgumentCaptor<AuditEntry> captor = ArgumentCaptor.forClass(AuditEntry.class);
        verify(writer).write(captor.capture());
        return captor.getValue();
    }
}
