package gg.overlab.backend.hero.relation.dto;

import gg.overlab.backend.hero.relation.RelationType;

public record RelationDto(
        Long id,
        String heroSlug,
        String relatedHeroSlug,
        RelationType type,
        int strength,
        String note) {
}
