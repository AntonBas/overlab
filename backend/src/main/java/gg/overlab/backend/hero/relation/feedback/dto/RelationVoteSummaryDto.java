package gg.overlab.backend.hero.relation.feedback.dto;

import gg.overlab.backend.hero.relation.RelationType;

public record RelationVoteSummaryDto(
        Long relationId,
        String heroSlug,
        String relatedHeroSlug,
        RelationType type,
        long up,
        long down) {
}
