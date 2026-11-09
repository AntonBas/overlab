package gg.overlab.backend.guide;

import gg.overlab.backend.common.TimestampedEntity;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "guides")
public class Guide extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hero_id", nullable = false)
    private Hero hero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "map_id")
    private GameMap map;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(nullable = false, length = 256)
    private String title;

    @Column(name = "youtube_id", nullable = false, length = 32)
    private String youtubeId;

    @Column(name = "start_seconds", nullable = false)
    private int startSeconds;

    @Column(name = "end_seconds")
    private Integer endSeconds;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GuideKind kind = GuideKind.TIP;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private GuideSide side = GuideSide.BOTH;

    @Column(name = "ability_slug", length = 100)
    private String abilitySlug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean published;
}
