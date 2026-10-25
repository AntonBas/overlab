package gg.overlab.backend.hero.perk.dto;

import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkSlot;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PerkRequest(
        @NotBlank String heroSlug,
        @NotBlank @Size(max = 128) String name,
        @Size(max = 2000) String description,
        @NotNull PerkSlot slot,
        @NotNull PerkRecommendation recommendation,
        @Size(max = 2000) String recommendationNote) {
}
