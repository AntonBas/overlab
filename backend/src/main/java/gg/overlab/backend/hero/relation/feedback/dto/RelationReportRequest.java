package gg.overlab.backend.hero.relation.feedback.dto;

import gg.overlab.backend.hero.relation.RelationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RelationReportRequest(
        @NotBlank String heroSlug,
        @NotBlank String relatedHeroSlug,
        @NotNull RelationType type,
        @NotBlank @Size(min = 10, max = 1000) String message) {
}
