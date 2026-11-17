package gg.overlab.backend.hero.ability.dto;

import gg.overlab.backend.hero.ability.AbilityControl;
import java.io.Serializable;

public record AbilityDto(
        String heroSlug,
        String heroName,
        String heroPortraitUrl,
        String slug,
        String name,
        String description,
        String iconUrl,
        AbilityControl control,
        boolean recentlyAdded) implements Serializable {
}
