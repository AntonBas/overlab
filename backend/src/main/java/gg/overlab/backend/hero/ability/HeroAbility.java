package gg.overlab.backend.hero.ability;

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
@Table(name = "hero_abilities", uniqueConstraints = @UniqueConstraint(columnNames = {"hero_id", "slug"}))
public class HeroAbility extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hero_id", nullable = false)
    private Hero hero;

    @Column(nullable = false, length = 64)
    private String slug;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "icon_url", length = 512)
    private String iconUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "control_key", length = 16)
    private AbilityControl control;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
