package gg.overlab.backend.hero.ability.dto;

import java.io.Serializable;

public record AbilityDto(
        String heroSlug,
        String slug,
        String name,
        String description,
        String iconUrl) implements Serializable {
}
