package gg.overlab.backend.hero.category.dto;

import gg.overlab.backend.hero.HeroRole;
import java.io.Serializable;

public record CategoryMemberDto(String slug, String name, HeroRole role, String portraitUrl) implements Serializable {
}
