package gg.overlab.backend.hero;

import gg.overlab.backend.hero.dto.HeroDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/heroes")
@RequiredArgsConstructor
public class HeroController {

    private final HeroService heroService;

    @GetMapping
    public List<HeroDto> findAll() {
        return heroService.findAll();
    }

    @GetMapping("/{slug}")
    public HeroDto getBySlug(@PathVariable String slug) {
        return heroService.getBySlug(slug);
    }
}
