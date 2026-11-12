package gg.overlab.backend.hero.relation;

import gg.overlab.backend.hero.relation.dto.HeroCountersDto;
import gg.overlab.backend.hero.relation.dto.HeroRelationsDto;
import gg.overlab.backend.hero.relation.dto.RelatedHeroDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Hero relations")
@RestController
@RequiredArgsConstructor
public class HeroRelationController {

    private final HeroRelationService relationService;

    @Operation(summary = "Curated counters and synergies of all heroes (recommendations, not statistics)")
    @GetMapping("/api/hero-relations")
    public List<HeroRelationsDto> findAllRelations() {
        return relationService.findAllRelations();
    }

    @Operation(summary = "Curated counter-picks for a hero (recommendations, not statistics)")
    @GetMapping("/api/heroes/{slug}/counters")
    public HeroCountersDto getCounters(@PathVariable String slug) {
        return relationService.getCounters(slug);
    }

    @Operation(summary = "Curated synergies for a hero (recommendations, not statistics)")
    @GetMapping("/api/heroes/{slug}/synergies")
    public List<RelatedHeroDto> getSynergies(@PathVariable String slug) {
        return relationService.getSynergies(slug);
    }
}
