package gg.overlab.backend.user.personal;

import gg.overlab.backend.common.TimestampedEntity;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_preferences")
public class UserPreference extends TimestampedEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private GameQueue queue;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Platform platform;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Region region;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private RankTier tier;
}
