package gg.overlab.backend.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AuditSnapshotsTest {

    private record Sample(Long id, String name, boolean active, Instant releasedAt, BigDecimal rate, Kind kind) {
    }

    private enum Kind {
        FIRST,
        SECOND
    }

    private final Instant moment = Instant.parse("2026-10-25T10:00:00Z");

    @Test
    void snapshotKeepsSimpleValuesAndStringifiesTheRest() {
        Map<String, Object> snapshot = AuditSnapshots.of(new Sample(1L, "Ana", true, moment, new BigDecimal("1.50"), Kind.FIRST));

        assertThat(snapshot).containsEntry("id", 1L).containsEntry("name", "Ana").containsEntry("active", true)
                .containsEntry("releasedAt", "2026-10-25T10:00:00Z").containsEntry("kind", "FIRST");
        assertThat(snapshot.get("rate")).isEqualTo(new BigDecimal("1.50"));
    }

    @Test
    void snapshotKeepsNulls() {
        Map<String, Object> snapshot = AuditSnapshots.of(new Sample(1L, null, false, null, null, null));

        assertThat(snapshot).containsEntry("name", null).containsKey("releasedAt");
    }

    @Test
    void diffContainsOnlyChangedFieldsWithOldAndNewValue() {
        Map<String, Object> before = AuditSnapshots.of(new Sample(1L, "Ana", true, moment, null, Kind.FIRST));
        Map<String, Object> after = AuditSnapshots.of(new Sample(1L, "Ana", false, moment, null, Kind.SECOND));

        Map<String, Object> diff = AuditSnapshots.diff(before, after);

        assertThat(diff).containsOnlyKeys("active", "kind");
        assertThat(diff.get("active")).isEqualTo(Map.of("from", true, "to", false));
        assertThat(diff.get("kind")).isEqualTo(Map.of("from", "FIRST", "to", "SECOND"));
    }

    @Test
    void diffOfIdenticalSnapshotsIsEmpty() {
        Map<String, Object> snapshot = AuditSnapshots.of(new Sample(1L, "Ana", true, moment, null, Kind.FIRST));

        assertThat(AuditSnapshots.diff(snapshot, snapshot)).isEmpty();
    }
}
