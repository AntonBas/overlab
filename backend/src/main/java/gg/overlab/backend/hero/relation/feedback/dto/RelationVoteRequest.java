package gg.overlab.backend.hero.relation.feedback.dto;

import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.feedback.RelationVoteValue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RelationVoteRequest(
        @NotBlank String heroSlug,
        @NotBlank String relatedHeroSlug,
        @NotNull RelationType type,
        @NotNull RelationVoteValue value) {
}
