package gg.overlab.backend.hero.category;

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
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "hero_category_relations", uniqueConstraints = @UniqueConstraint(columnNames = {"hero_id", "category_id"}))
public class HeroCategoryRelation extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hero_id", nullable = false)
    private Hero hero;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private HeroCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CategoryMatchupType type;

    @Min(1)
    @Max(3)
    @Column(nullable = false)
    private short strength = 1;

    @Column(columnDefinition = "text")
    private String note;
}
