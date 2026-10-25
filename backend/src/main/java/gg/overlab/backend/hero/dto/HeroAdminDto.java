package gg.overlab.backend.hero.dto;

import gg.overlab.backend.hero.HeroRole;

public record HeroAdminDto(
        String slug,
        String name,
        HeroRole role,
        String subrole,
        String description,
        String portraitUrl,
        boolean active) {
}
