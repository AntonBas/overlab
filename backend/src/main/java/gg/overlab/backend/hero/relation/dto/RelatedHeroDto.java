package gg.overlab.backend.hero.relation.dto;

import gg.overlab.backend.hero.HeroRole;
import java.io.Serializable;

public record RelatedHeroDto(String slug, String name, HeroRole role, String note, String portraitUrl) implements Serializable {
}
