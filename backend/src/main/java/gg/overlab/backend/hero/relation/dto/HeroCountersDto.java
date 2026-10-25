package gg.overlab.backend.hero.relation.dto;

import java.io.Serializable;
import java.util.List;

public record HeroCountersDto(List<RelatedHeroDto> counters, List<RelatedHeroDto> counteredBy) implements Serializable {
}
