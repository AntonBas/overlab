package gg.overlab.backend.hero.relation.dto;

import java.io.Serializable;
import java.util.List;

public record HeroRelationsDto(String heroSlug, List<RelatedHeroDto> counters, List<RelatedHeroDto> counteredBy,
                               List<RelatedHeroDto> synergies) implements Serializable {
}
