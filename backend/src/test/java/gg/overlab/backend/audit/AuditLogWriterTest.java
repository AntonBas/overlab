package gg.overlab.backend.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AuditLogWriterTest {

    private final AuditLogRepository repository = mock(AuditLogRepository.class);
    private final SimpleMeterRegistry registry = new SimpleMeterRegistry();
    private final AuditLogWriter writer = new AuditLogWriter(repository, registry);

    private AuditEntry entry() {
        return new AuditEntry(Instant.now(), 1L, "ADMIN", AuditAction.values()[0], "hero", "1", Map.of(), null);
    }

    @Test
    void failedWriteIsCountedAndSwallowed() {
        doThrow(new IllegalStateException("db down")).when(repository).save(any(AuditLog.class));

        writer.write(entry());

        assertThat(registry.counter("audit.write.failed").count()).isEqualTo(1);
    }

    @Test
    void successfulWriteDoesNotCount() {
        writer.write(entry());

        assertThat(registry.counter("audit.write.failed").count()).isZero();
    }
}
