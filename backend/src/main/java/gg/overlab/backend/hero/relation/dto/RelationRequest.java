package gg.overlab.backend.hero.relation.dto;

import gg.overlab.backend.hero.relation.RelationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RelationRequest(
        @NotBlank String heroSlug,
        @NotBlank String relatedHeroSlug,
        @NotNull RelationType type,
        @Size(max = 2000) String note) {
}
