package gg.overlab.backend.hero.perk.dto;

import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkSlot;
import java.io.Serializable;

public record PerkDto(
        Long id,
        String heroSlug,
        String name,
        String description,
        PerkSlot slot,
        PerkRecommendation recommendation,
        String recommendationNote,
        String iconUrl) implements Serializable {
}
