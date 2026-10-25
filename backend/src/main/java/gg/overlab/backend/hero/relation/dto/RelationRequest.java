package gg.overlab.backend.hero.relation.dto;

import gg.overlab.backend.hero.relation.RelationType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RelationRequest(
        @NotBlank String heroSlug,
        @NotBlank String relatedHeroSlug,
        @NotNull RelationType type,
        @NotNull @Min(1) @Max(3) Integer strength,
        @Size(max = 2000) String note) {
}
