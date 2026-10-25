package gg.overlab.backend.hero.relation;

import gg.overlab.backend.hero.relation.dto.HeroCountersDto;
import gg.overlab.backend.hero.relation.dto.RelatedHeroDto;
import gg.overlab.backend.hero.relation.dto.RelationDto;
import gg.overlab.backend.hero.relation.dto.RelationRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class HeroRelationController {

    private final HeroRelationService relationService;

    @GetMapping("/api/heroes/{slug}/counters")
    public HeroCountersDto getCounters(@PathVariable String slug) {
        return relationService.getCounters(slug);
    }

    @GetMapping("/api/heroes/{slug}/synergies")
    public List<RelatedHeroDto> getSynergies(@PathVariable String slug) {
        return relationService.getSynergies(slug);
    }

    @GetMapping("/api/admin/hero-relations")
    public List<RelationDto> findForAdmin(@RequestParam(required = false) String hero) {
        return relationService.findForAdmin(hero);
    }

    @PostMapping("/api/admin/hero-relations")
    @ResponseStatus(HttpStatus.CREATED)
    public RelationDto create(@Valid @RequestBody RelationRequest request) {
        return relationService.create(request);
    }

    @PutMapping("/api/admin/hero-relations/{id}")
    public RelationDto update(@PathVariable Long id, @Valid @RequestBody RelationRequest request) {
        return relationService.update(id, request);
    }

    @DeleteMapping("/api/admin/hero-relations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        relationService.delete(id);
    }
}
