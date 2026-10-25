package gg.overlab.backend.hero.relation.dto;

import gg.overlab.backend.hero.HeroRole;
import java.io.Serializable;

public record RelatedHeroDto(String slug, String name, HeroRole role, int strength, String note)
        implements Serializable {
}
