package gg.overlab.backend.hero.perk;

import gg.overlab.backend.hero.perk.dto.PerkDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Perks")
@RestController
@RequiredArgsConstructor
public class PerkController {

    private final PerkService perkService;

    @Operation(summary = "List perks of all heroes")
    @GetMapping("/api/perks")
    public List<PerkDto> findAll() {
        return perkService.findAll();
    }

    @Operation(summary = "List perks of a hero")
    @GetMapping("/api/heroes/{slug}/perks")
    public List<PerkDto> findByHero(@PathVariable String slug) {
        return perkService.findByHero(slug);
    }
}
