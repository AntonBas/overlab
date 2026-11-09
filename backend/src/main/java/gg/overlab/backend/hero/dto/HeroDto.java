package gg.overlab.backend.hero.dto;

import gg.overlab.backend.hero.HeroRole;
import java.io.Serializable;

public record HeroDto(
        String slug,
        String name,
        HeroRole role,
        String subrole,
        String description,
        String strengths,
        String weaknesses,
        String portraitUrl,
        boolean recentlyAdded) implements Serializable {
}
