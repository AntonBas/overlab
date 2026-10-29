package gg.overlab.backend.stats;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "snapshot_checks")
public class SnapshotCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GameQueue queue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Platform platform;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Region region;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RankTier tier;

    @Column(name = "map_key", nullable = false, length = 64)
    private String mapKey;

    @Column(length = 255)
    private String etag;

    @Column(nullable = false, length = 64)
    private String signature;

    @Column(name = "last_checked_at", nullable = false)
    private Instant lastCheckedAt;

    @Column(name = "last_changed_at", nullable = false)
    private Instant lastChangedAt;
}
