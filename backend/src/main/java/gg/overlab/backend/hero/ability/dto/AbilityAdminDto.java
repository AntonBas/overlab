package gg.overlab.backend.hero.ability.dto;

import gg.overlab.backend.hero.ability.AbilityControl;

public record AbilityAdminDto(
        Long id,
        String heroSlug,
        String name,
        String iconUrl,
        AbilityControl control) {
}
