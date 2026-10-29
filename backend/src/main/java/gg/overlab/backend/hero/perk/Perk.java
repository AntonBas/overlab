package gg.overlab.backend.hero.perk;

import gg.overlab.backend.common.TimestampedEntity;
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
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "perks", uniqueConstraints = @UniqueConstraint(columnNames = {"hero_id", "name"}))
public class Perk extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hero_id", nullable = false)
    private Hero hero;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PerkSlot slot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private PerkPosition position = PerkPosition.LEFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PerkRecommendation recommendation;

    @Column(name = "recommendation_note", columnDefinition = "text")
    private String recommendationNote;

    @Column(name = "icon_url", length = 512)
    private String iconUrl;
}
