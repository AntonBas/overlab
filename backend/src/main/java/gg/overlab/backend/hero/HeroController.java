package gg.overlab.backend.hero;

import gg.overlab.backend.hero.dto.HeroDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Heroes")
@RestController
@RequestMapping("/api/heroes")
@RequiredArgsConstructor
public class HeroController {

    private final HeroService heroService;

    @Operation(summary = "List heroes")
    @GetMapping
    public List<HeroDto> findAll() {
        return heroService.findAll();
    }

    @Operation(summary = "Get a hero by slug")
    @GetMapping("/{slug}")
    public HeroDto getBySlug(@PathVariable String slug) {
        return heroService.getBySlug(slug);
    }
}
