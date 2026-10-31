package gg.overlab.backend.hero.ability;

import gg.overlab.backend.hero.ability.dto.AbilityDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Abilities")
@RestController
@RequiredArgsConstructor
public class AbilityController {

    private final AbilityService abilityService;

    @Operation(summary = "List abilities of all heroes")
    @GetMapping("/api/abilities")
    public List<AbilityDto> findAll() {
        return abilityService.findAll();
    }

    @Operation(summary = "List abilities of a hero")
    @GetMapping("/api/heroes/{slug}/abilities")
    public List<AbilityDto> findByHero(@PathVariable String slug) {
        return abilityService.findByHero(slug);
    }
}
