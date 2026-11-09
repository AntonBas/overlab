package gg.overlab.backend.hero.relation.feedback.dto;

import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.feedback.RelationVoteValue;

public record RelationVoteDto(String heroSlug, String relatedHeroSlug, RelationType type, RelationVoteValue value) {
}
