package gg.overlab.backend.stats;

import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.hero.Hero;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "hero_stats")
public class HeroStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hero_id", nullable = false)
    private Hero hero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "map_id")
    private GameMap map;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GameQueue queue;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_format", nullable = false, length = 16)
    private GameFormat gameFormat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Platform platform;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Region region;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RankTier tier;

    @Column(name = "win_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal winRate;

    @Column(name = "pick_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal pickRate;

    @Column(name = "ban_rate", precision = 5, scale = 2)
    private BigDecimal banRate;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SnapshotSource source = SnapshotSource.COLLECTOR;
}
